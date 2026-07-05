import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  async onboardFreelancer(userId: string, email: string, name: string, phone: string) {
    const client = this.supabaseService.getAdminClient();

    // 1. Verify freelancer profile exists
    const { data: profile, error: profileErr } = await client
      .from('freelancer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      throw new BadRequestException('Freelancer profile not found. Please complete onboarding first.');
    }

    if (profile.razorpay_linked_account_id) {
      return {
        message: 'Account already onboarded.',
        accountId: profile.razorpay_linked_account_id,
        kycStatus: profile.kyc_status,
      };
    }

    try {
      // 2. Call Razorpay API to create standard Linked Account
      const account = await this.razorpay.accounts.create({
        email: email,
        phone: phone || '9999999999',
        type: 'standard',
        reference_id: userId,
        legal_business_name: name,
        contact_name: name,
        profile: {
          category: 'software',
          subcategory: 'website_development',
          addresses: {
            registered: {
              street1: '123 Main St',
              city: 'Mumbai',
              state: 'MH',
              postal_code: '400001',
              country: 'IN',
            },
          },
        },
      } as any);

      const accountId = account.id;

      // 3. Update freelancer profile with Razorpay account ID
      await client
        .from('freelancer_profiles')
        .update({
          razorpay_linked_account_id: accountId,
          kyc_status: 'PENDING',
        })
        .eq('user_id', userId);

      return {
        message: 'Razorpay linked account created successfully.',
        accountId,
        kycStatus: 'PENDING',
      };
    } catch (err: any) {
      console.error('Razorpay API Error Response:', JSON.stringify(err, null, 2));
      const errorMsg = err.error?.description || err.description || err.message || JSON.stringify(err);
      throw new BadRequestException(`Razorpay onboarding failed: ${errorMsg}`);
    }
  }
}
