import { SupabaseService } from '../supabase.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class FreelancersService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    createProfile(createProfileDto: CreateProfileDto): Promise<any>;
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any>;
    findAll(): Promise<any[]>;
}
