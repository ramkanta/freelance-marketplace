import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class RazorpayService {
  private keyId: string;
  private keySecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID')!;
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET')!;
  }

  private getAuthHeader() {
    const credentials = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    return { Authorization: `Basic ${credentials}` };
  }

  async onboardFreelancer(
    userId: string, 
    email: string, 
    name: string, 
    phone: string,
    accountNumber: string,
    ifsc: string
  ) {
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

    try {
      // 2. Create Contact in RazorpayX
      const contactResponse = await axios.post(
        'https://api.razorpay.com/v1/contacts',
        {
          name,
          email,
          contact: phone,
          type: 'vendor',
          reference_id: userId,
        },
        { headers: this.getAuthHeader() }
      );

      const contactId = contactResponse.data.id;

      // 3. Create Fund Account in RazorpayX
      const fundResponse = await axios.post(
        'https://api.razorpay.com/v1/fund_accounts',
        {
          contact_id: contactId,
          account_type: 'bank_account',
          bank_account: {
            name,
            ifsc,
            account_number: accountNumber,
          },
        },
        { headers: this.getAuthHeader() }
      );

      const fundAccountId = fundResponse.data.id;

      // 4. Update freelancer profile with RazorpayX details
      await client
        .from('freelancer_profiles')
        .update({
          razorpay_contact_id: contactId,
          razorpay_fund_account_id: fundAccountId,
          kyc_status: 'APPROVED', // Auto approved for testing/payouts in standard mode
        })
        .eq('user_id', userId);

      return {
        message: 'RazorpayX payout account created successfully.',
        contactId,
        fundAccountId,
        kycStatus: 'APPROVED',
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.description || err.message;
      throw new BadRequestException(`RazorpayX onboarding failed: ${errorMsg}`);
    }
  }

  async triggerPayout(userId: string, amountInRupees: number) {
    const client = this.supabaseService.getAdminClient();

    // 1. Fetch freelancer profile
    const { data: profile, error: profileErr } = await client
      .from('freelancer_profiles')
      .select('razorpay_fund_account_id, kyc_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileErr || !profile || !profile.razorpay_fund_account_id) {
      throw new BadRequestException('Freelancer payout account not set up. Please link your bank account first.');
    }

    const razorpayXAccountNumber = this.configService.get<string>('RAZORPAYX_ACCOUNT_NUMBER');
    if (!razorpayXAccountNumber) {
      throw new BadRequestException('Payout service is not configured. Please contact support.');
    }

    try {
      // Unique idempotency key — required by Razorpay payout API
      const idempotencyKey = `payout-${userId}-${Date.now()}`;

      // 2. Trigger RazorpayX Payout
      const payoutResponse = await axios.post(
        'https://api.razorpay.com/v1/payouts',
        {
          account_number: razorpayXAccountNumber,
          fund_account_id: profile.razorpay_fund_account_id,
          amount: amountInRupees * 100, // convert rupees to paise
          currency: 'INR',
          mode: 'IMPS',
          purpose: 'payout',
          queue_if_low_balance: true,
        },
        {
          headers: {
            ...this.getAuthHeader(),
            'X-Payout-Idempotency': idempotencyKey,
          },
        }
      );

      return {
        success: true,
        payoutId: payoutResponse.data.id,
        status: payoutResponse.data.status,
        amount: amountInRupees,
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.description || err.message;
      throw new BadRequestException(`Payout transaction failed: ${errorMsg}`);
    }
  }
}
