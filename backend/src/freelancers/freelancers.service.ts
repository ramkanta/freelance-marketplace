import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class FreelancersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly razorpayService: RazorpayService,
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

  async withdrawEarnings(userId: string, amount: number) {
    const client = this.supabaseService.getAdminClient();
    const result = await this.razorpayService.triggerPayout(userId, amount);

    await client.from('payouts').insert({
      user_id: userId,
      amount,
      payout_id: result.payoutId || null,
      status: result.status === 'processed' ? 'SUCCESS' : 'PENDING',
    });

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
      .select('*, user:users(name, email)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      throw new NotFoundException('Freelancer profile not found.');
    }
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const client = this.supabaseService.getAdminClient();
    const { category, bio } = updateProfileDto;

    const { data: profile } = await client
      .from('freelancer_profiles')
      .update({ category, bio })
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
      .select('*, user:users(name, email)');

    if (error) {
      throw new ConflictException(`Failed to retrieve profiles: ${error.message}`);
    }
    return profiles;
  }
}
