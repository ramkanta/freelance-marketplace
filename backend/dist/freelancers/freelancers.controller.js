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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreelancersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const freelancers_service_1 = require("./freelancers.service");
const create_profile_dto_1 = require("./dto/create-profile.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const public_decorator_1 = require("../auth/public.decorator");
const roles_decorator_1 = require("../auth/roles.decorator");
let FreelancersController = class FreelancersController {
    freelancersService;
    constructor(freelancersService) {
        this.freelancersService = freelancersService;
    }
    async createProfile(createProfileDto) {
        return this.freelancersService.createProfile(createProfileDto);
    }
    async findAll() {
        return this.freelancersService.findAll();
    }
    async getProfile(userId) {
        return this.freelancersService.getProfile(userId);
    }
    async updateProfile(userId, updateProfileDto) {
        return this.freelancersService.updateProfile(userId, updateProfileDto);
    }
    async onboardPayouts(userId, phone, accountNumber, ifsc) {
        return this.freelancersService.onboardPayouts(userId, phone, accountNumber, ifsc);
    }
    async withdrawEarnings(userId, amount) {
        return this.freelancersService.withdrawEarnings(userId, amount);
    }
    async getWithdrawals(userId) {
        return this.freelancersService.getWithdrawals(userId);
    }
};
exports.FreelancersController = FreelancersController;
__decorate([
    (0, roles_decorator_1.Roles)('freelancer'),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a freelancer profile' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Freelancer profile successfully created.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Freelancer profile already exists for this user.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_profile_dto_1.CreateProfileDto]),
    __metadata("design:returntype", Promise)
], FreelancersController.prototype, "createProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve all freelancer profiles' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns lists of freelancers joined with user name/email.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FreelancersController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve a freelancer profile by user ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns freelancer profile details.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Freelancer profile not found.' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FreelancersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)(':userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a freelancer profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Freelancer profile successfully updated.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Freelancer profile not found.' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], FreelancersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)(':userId/onboard-payouts'),
    (0, swagger_1.ApiOperation)({ summary: 'Onboard freelancer to RazorpayX for direct payouts' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'RazorpayX fund account successfully created.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or profile not found.' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('phone')),
    __param(2, (0, common_1.Body)('accountNumber')),
    __param(3, (0, common_1.Body)('ifsc')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], FreelancersController.prototype, "onboardPayouts", null);
__decorate([
    (0, common_1.Post)(':userId/withdraw'),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw accumulated earnings using RazorpayX' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payout completed successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request / transaction failed.' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FreelancersController.prototype, "withdrawEarnings", null);
__decorate([
    (0, common_1.Get)(':userId/withdrawals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get freelancer withdrawal history log' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns list of past withdrawals.' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FreelancersController.prototype, "getWithdrawals", null);
exports.FreelancersController = FreelancersController = __decorate([
    (0, swagger_1.ApiTags)('Freelancers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/freelancers'),
    __metadata("design:paramtypes", [freelancers_service_1.FreelancersService])
], FreelancersController);
//# sourceMappingURL=freelancers.controller.js.map