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

  private async computeAvailableBalance(userId: string): Promise<number> {
    const client = this.supabaseService.getAdminClient();

    const { data: orders } = await client
      .from('orders')
      .select('amount, commission_rate')
      .eq('freelancer_id', userId)
      .in('status', ['payout_released', 'completed']);

    const totalEarned = (orders ?? []).reduce((sum, o) => {
      return sum + Number(o.amount) * (1 - Number(o.commission_rate) / 100);
    }, 0);

    const { data: payouts } = await client
      .from('payouts')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'SUCCESS');

    const totalWithdrawn = (payouts ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

    return Math.max(0, totalEarned - totalWithdrawn);
  }

  async withdrawEarnings(userId: string, amount: number) {
    const client = this.supabaseService.getAdminClient();

    const available = await this.computeAvailableBalance(userId);
    if (amount <= 0) throw new BadRequestException('Withdrawal amount must be greater than zero.');
    if (amount > available) {
      throw new BadRequestException(
        `Insufficient balance. Available: ₹${available.toFixed(2)}, requested: ₹${amount.toFixed(2)}.`,
      );
    }

    const result = await this.razorpayService.triggerPayout(userId, amount);

    await client.from('payouts').insert({
      user_id: userId,
      amount,
      payout_id: result.payoutId || null,
      status: result.status === 'processed' ? 'SUCCESS' : 'PENDING',
    });

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

  async getProfile(userId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data: profile } = await client
      .from('freelancer_profiles')
      .select('*, users(name, email)')
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

  async findAll() {
    const client = this.supabaseService.getAdminClient();
    const { data: profiles, error } = await client
      .from('freelancer_profiles')
      .select('*, users(name, email)');

    if (error) {
      throw new ConflictException(`Failed to retrieve profiles: ${error.message}`);
    }
    return profiles;
  }
}
