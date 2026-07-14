import { SupabaseService } from '../supabase.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { EmailService } from '../email/email.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class FreelancersService {
    private readonly supabaseService;
    private readonly razorpayService;
    private readonly emailService;
    constructor(supabaseService: SupabaseService, razorpayService: RazorpayService, emailService: EmailService);
    onboardPayouts(userId: string, phone: string, accountNumber: string, ifsc: string): Promise<{
        message: string;
        contactId: any;
        fundAccountId: any;
        kycStatus: string;
    }>;
    private computeAvailableBalance;
    getAvailableBalance(userId: string): Promise<number>;
    withdrawEarnings(userId: string, amount: number): Promise<{
        success: boolean;
        payoutId: any;
        status: any;
        amount: number;
    }>;
    getWithdrawals(userId: string): Promise<any[]>;
    createProfile(createProfileDto: CreateProfileDto): Promise<any>;
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any>;
    findAll(): Promise<any[]>;
}
