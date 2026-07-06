import { SupabaseService } from '../supabase.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class FreelancersService {
    private readonly supabaseService;
    private readonly razorpayService;
    constructor(supabaseService: SupabaseService, razorpayService: RazorpayService);
    onboardPayouts(userId: string, phone: string, accountNumber: string, ifsc: string): Promise<{
        message: string;
        contactId: any;
        fundAccountId: any;
        kycStatus: string;
    }>;
    withdrawEarnings(userId: string, amount: number): Promise<{
        success: boolean;
        payoutId: any;
        status: any;
        amount: number;
    }>;
    createProfile(createProfileDto: CreateProfileDto): Promise<any>;
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any>;
    findAll(): Promise<any[]>;
}
