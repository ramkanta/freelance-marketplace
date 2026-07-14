import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { EmailService } from '../email/email.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class FreelancersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly razorpayService: RazorpayService,
    private readonly emailService: EmailService,
  ) {}

  async onboardPayouts(
    userId: string, 
    phone: string,
    accountNumber: string,
    ifsc: string
  ) {
    const client = this.supabaseService.getAdminClient();

    // 1. Fetch user details
    const { data: user, error } = await client
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new NotFoundException('User not found.');
    }

    // 2. Call Razorpay onboarding
    return this.razorpayService.onboardFreelancer(
      userId, 
      user.email, 
      user.name, 
      phone,
      accountNumber,
      ifsc
    );
  }

  // C3/C4: balance is derived purely from the ledger (freelancer_wallet credits
  // from escrow_release, minus freelancer_withdrawal debits for every payout
  // ever reserved — PENDING or SUCCESS both count). This is only used for
  // read-only display now; the actual withdrawal path below reserves the
  // balance atomically inside reserve_freelancer_withdrawal() so a stale read
  // here can never be exploited for a double-withdraw.
  private async computeAvailableBalance(userId: string): Promise<number> {
    const client = this.supabaseService.getAdminClient();

    const { data: credits } = await client
      .from('ledger_entries')
      .select('amount')
      .eq('credit_account', `freelancer_wallet:${userId}`)
      .eq('entry_type', 'escrow_release');

    const { data: debits } = await client
      .from('ledger_entries')
      .select('amount')
      .eq('debit_account', `freelancer_wallet:${userId}`)
      .eq('entry_type', 'freelancer_withdrawal');

    const totalEarned = (credits ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
    const totalReserved = (debits ?? []).reduce((sum, r) => sum + Number(r.amount), 0);

    return Math.max(0, totalEarned - totalReserved);
  }

  async getAvailableBalance(userId: string): Promise<number> {
    return this.computeAvailableBalance(userId);
  }

  // C3/C4/C5/H6: the balance check, ledger debit, and PENDING payout row are
  // all written atomically inside reserve_freelancer_withdrawal() — locked per
  // freelancer, so two concurrent withdrawal requests can never both pass the
  // balance check (fixes the double-withdraw race and the "PENDING payouts
  // never deducted" bug, since PENDING debits count against balance the
  // instant they're reserved, before Razorpay is ever called).
  //
  // The payout row exists in the DB *before* we call Razorpay (H6): if the
  // transfer itself fails, reverse_failed_withdrawal() issues an offsetting
  // ledger credit and marks the payout FAILED, so the freelancer's balance is
  // restored and no money is silently lost from the ledger's point of view.
  async withdrawEarnings(userId: string, amount: number) {
    const client = this.supabaseService.getAdminClient();

    if (amount <= 0) throw new BadRequestException('Withdrawal amount must be greater than zero.');

    const { data: reserved, error: reserveError } = await client
      .rpc('reserve_freelancer_withdrawal', { p_user_id: userId, p_amount: amount })
      .single();

    if (reserveError) {
      const msg = reserveError.message ?? '';
      if (msg.includes('insufficient_balance')) {
        const [, balance] = msg.split(':');
        throw new BadRequestException(
          `Insufficient balance. Available: ₹${Number(balance).toFixed(2)}, requested: ₹${amount.toFixed(2)}.`,
        );
      }
      throw new BadRequestException(`Withdrawal reservation failed: ${msg}`);
    }

    const { payout_id: payoutId } = reserved as { payout_id: string; reserved_amount: number };

    let result: Awaited<ReturnType<RazorpayService['triggerPayout']>>;
    try {
      result = await this.razorpayService.triggerPayout(userId, amount, payoutId);
    } catch (err) {
      // The transfer never happened (or we can't confirm it did) — reverse the
      // reservation so the freelancer isn't locked out of funds they never received.
      await client.rpc('reverse_failed_withdrawal', { p_payout_id: payoutId }).single();
      throw err;
    }

    await client
      .from('payouts')
      .update({
        payout_id: result.payoutId || null,
        status: result.status === 'processed' ? 'SUCCESS' : 'PENDING',
      })
      .eq('id', payoutId);

    const { data: user } = await client.from('users').select('email, name').eq('id', userId).maybeSingle();
    if (user) {
      this.emailService.sendWithdrawalInitiated(user.email, user.name, amount).catch(() => {});
    }

    return result;
  }

  async getWithdrawals(userId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ConflictException(`Failed to retrieve payouts: ${error.message}`);
    }
    return data;
  }

  async createProfile(createProfileDto: CreateProfileDto) {
    const client = this.supabaseService.getAdminClient();
    const { userId, category, bio } = createProfileDto;

    // 1. Verify user exists
    const { data: user } = await client
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // 2. Update user role to freelancer if it isn't already
    if (user.role !== 'freelancer') {
      await client.from('users').update({ role: 'freelancer' }).eq('id', userId);
    }

    // 3. Insert freelancer profile
    const { data: profile, error } = await client
      .from('freelancer_profiles')
      .insert({
        user_id: userId,
        category,
        bio,
      })
      .select()
      .single();

    if (error) {
      throw new ConflictException(`Failed to create freelancer profile: ${error.message}`);
    }

    return profile;
  }

  // H8: this endpoint is @Public() — never select email here. It's rendered
  // on the public freelancer profile page and would otherwise let anyone
  // scrape every freelancer's email address unauthenticated.
  async getProfile(userId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data: profile } = await client
      .from('freelancer_profiles')
      .select('*, users(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      throw new NotFoundException('Freelancer profile not found.');
    }
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const client = this.supabaseService.getAdminClient();
    const { category, bio, portfolio_url } = updateProfileDto;

    const updates: Record<string, unknown> = {};
    if (category !== undefined) updates.category = category;
    if (bio !== undefined) updates.bio = bio;
    if (portfolio_url !== undefined) updates.portfolio_url = portfolio_url;

    const { data: profile } = await client
      .from('freelancer_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (!profile) {
      throw new NotFoundException('Freelancer profile not found or update failed.');
    }

    return profile;
  }

  // H8: also @Public() — same email-leak concern as getProfile above.
  async findAll() {
    const client = this.supabaseService.getAdminClient();
    const { data: profiles, error } = await client
      .from('freelancer_profiles')
      .select('*, users(name)');

    if (error) {
      throw new ConflictException(`Failed to retrieve profiles: ${error.message}`);
    }
    return profiles;
  }
}
