import { SupabaseService } from '../supabase.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class FreelancersService {
    private readonly supabaseService;
    private readonly razorpayService;
    constructor(supabaseService: SupabaseService, razorpayService: RazorpayService);
    onboardPayouts(userId: string, phone: string): Promise<{
        message: string;
        accountId: any;
        kycStatus: any;
    }>;
    createProfile(createProfileDto: CreateProfileDto): Promise<any>;
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any>;
    findAll(): Promise<any[]>;
}
