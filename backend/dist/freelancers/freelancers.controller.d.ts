import { FreelancersService } from './freelancers.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { FastifyRequest } from 'fastify';
export declare class FreelancersController {
    private readonly freelancersService;
    constructor(freelancersService: FreelancersService);
    createProfile(createProfileDto: CreateProfileDto): Promise<any>;
    findAll(): Promise<any[]>;
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto, req: FastifyRequest & {
        user: {
            sub: string;
        };
    }): Promise<any>;
    onboardPayouts(userId: string, phone: string, accountNumber: string, ifsc: string, req: FastifyRequest & {
        user: {
            sub: string;
        };
    }): Promise<{
        message: string;
        contactId: any;
        fundAccountId: any;
        kycStatus: string;
    }>;
    withdrawEarnings(userId: string, amount: number, req: FastifyRequest & {
        user: {
            sub: string;
        };
    }): Promise<{
        success: boolean;
        payoutId: any;
        status: any;
        amount: number;
    }>;
    getBalance(userId: string, req: FastifyRequest & {
        user: {
            sub: string;
        };
    }): Promise<{
        balance: number;
    }>;
    getWithdrawals(userId: string, req: FastifyRequest & {
        user: {
            sub: string;
        };
    }): Promise<any[]>;
}
