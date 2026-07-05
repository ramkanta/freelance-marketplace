import { FreelancersService } from './freelancers.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class FreelancersController {
    private readonly freelancersService;
    constructor(freelancersService: FreelancersService);
    createProfile(createProfileDto: CreateProfileDto): Promise<any>;
    findAll(): Promise<any[]>;
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any>;
}
