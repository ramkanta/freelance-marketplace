"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreelancersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase.service");
const razorpay_service_1 = require("../razorpay/razorpay.service");
let FreelancersService = class FreelancersService {
    supabaseService;
    razorpayService;
    constructor(supabaseService, razorpayService) {
        this.supabaseService = supabaseService;
        this.razorpayService = razorpayService;
    }
    async onboardPayouts(userId, phone, accountNumber, ifsc) {
        const client = this.supabaseService.getAdminClient();
        const { data: user, error } = await client
            .from('users')
            .select('name, email')
            .eq('id', userId)
            .maybeSingle();
        if (error || !user) {
            throw new common_1.NotFoundException('User not found.');
        }
        return this.razorpayService.onboardFreelancer(userId, user.email, user.name, phone, accountNumber, ifsc);
    }
    async withdrawEarnings(userId, amount) {
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
    async getWithdrawals(userId) {
        const client = this.supabaseService.getAdminClient();
        const { data, error } = await client
            .from('payouts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new common_1.ConflictException(`Failed to retrieve payouts: ${error.message}`);
        }
        return data;
    }
    async createProfile(createProfileDto) {
        const client = this.supabaseService.getAdminClient();
        const { userId, category, bio } = createProfileDto;
        const { data: user } = await client
            .from('users')
            .select('id, role')
            .eq('id', userId)
            .maybeSingle();
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        if (user.role !== 'freelancer') {
            await client.from('users').update({ role: 'freelancer' }).eq('id', userId);
        }
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
            throw new common_1.ConflictException(`Failed to create freelancer profile: ${error.message}`);
        }
        return profile;
    }
    async getProfile(userId) {
        const client = this.supabaseService.getAdminClient();
        const { data: profile } = await client
            .from('freelancer_profiles')
            .select('*, user:users(name, email)')
            .eq('user_id', userId)
            .maybeSingle();
        if (!profile) {
            throw new common_1.NotFoundException('Freelancer profile not found.');
        }
        return profile;
    }
    async updateProfile(userId, updateProfileDto) {
        const client = this.supabaseService.getAdminClient();
        const { category, bio } = updateProfileDto;
        const { data: profile } = await client
            .from('freelancer_profiles')
            .update({ category, bio })
            .eq('user_id', userId)
            .select()
            .single();
        if (!profile) {
            throw new common_1.NotFoundException('Freelancer profile not found or update failed.');
        }
        return profile;
    }
    async findAll() {
        const client = this.supabaseService.getAdminClient();
        const { data: profiles, error } = await client
            .from('freelancer_profiles')
            .select('*, user:users(name, email)');
        if (error) {
            throw new common_1.ConflictException(`Failed to retrieve profiles: ${error.message}`);
        }
        return profiles;
    }
};
exports.FreelancersService = FreelancersService;
exports.FreelancersService = FreelancersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        razorpay_service_1.RazorpayService])
], FreelancersService);
//# sourceMappingURL=freelancers.service.js.map