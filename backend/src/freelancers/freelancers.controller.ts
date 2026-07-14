import { Controller, Get, Post, Patch, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FreelancersService } from './freelancers.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import type { FastifyRequest } from 'fastify';

@ApiTags('Freelancers')
@ApiBearerAuth()
@Controller('api/v1/freelancers')
export class FreelancersController {
  constructor(private readonly freelancersService: FreelancersService) {}

  @Roles('freelancer')
  @Post()
  @ApiOperation({ summary: 'Create a freelancer profile' })
  @ApiResponse({ status: 201, description: 'Freelancer profile successfully created.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 409, description: 'Freelancer profile already exists for this user.' })
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    return this.freelancersService.createProfile(createProfileDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Retrieve all freelancer profiles' })
  @ApiResponse({ status: 200, description: 'Returns lists of freelancers joined with user name/email.' })
  async findAll() {
    return this.freelancersService.findAll();
  }

  @Public()
  @Get(':userId')
  @ApiOperation({ summary: 'Retrieve a freelancer profile by user ID' })
  @ApiResponse({ status: 200, description: 'Returns freelancer profile details.' })
  @ApiResponse({ status: 404, description: 'Freelancer profile not found.' })
  async getProfile(@Param('userId') userId: string) {
    return this.freelancersService.getProfile(userId);
  }

  @Roles('freelancer')
  @Patch(':userId')
  @ApiOperation({ summary: 'Update a freelancer profile' })
  @ApiResponse({ status: 200, description: 'Freelancer profile successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden — can only update your own profile.' })
  @ApiResponse({ status: 404, description: 'Freelancer profile not found.' })
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: FastifyRequest & { user: { sub: string } },
  ) {
    if (req.user.sub !== userId) throw new ForbiddenException('You can only update your own profile.');
    return this.freelancersService.updateProfile(userId, updateProfileDto);
  }

  @Roles('freelancer')
  @Post(':userId/onboard-payouts')
  @ApiOperation({ summary: 'Onboard freelancer to RazorpayX for direct payouts' })
  @ApiResponse({ status: 200, description: 'RazorpayX fund account successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User or profile not found.' })
  async onboardPayouts(
    @Param('userId') userId: string,
    @Body('phone') phone: string,
    @Body('accountNumber') accountNumber: string,
    @Body('ifsc') ifsc: string,
    @Req() req: FastifyRequest & { user: { sub: string } },
  ) {
    if (req.user.sub !== userId) throw new ForbiddenException('You can only onboard your own account.');
    return this.freelancersService.onboardPayouts(userId, phone, accountNumber, ifsc);
  }

  @Roles('freelancer')
  @Post(':userId/withdraw')
  @ApiOperation({ summary: 'Withdraw accumulated earnings using RazorpayX' })
  @ApiResponse({ status: 200, description: 'Payout completed successfully.' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async withdrawEarnings(
    @Param('userId') userId: string,
    @Body('amount') amount: number,
    @Req() req: FastifyRequest & { user: { sub: string } },
  ) {
    if (req.user.sub !== userId) throw new ForbiddenException('You can only withdraw your own earnings.');
    return this.freelancersService.withdrawEarnings(userId, amount);
  }

  @Roles('freelancer')
  @Get(':userId/balance')
  @ApiOperation({ summary: 'Get available-to-withdraw balance, derived from the ledger' })
  @ApiResponse({ status: 200, description: 'Returns the available balance.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getBalance(
    @Param('userId') userId: string,
    @Req() req: FastifyRequest & { user: { sub: string } },
  ) {
    if (req.user.sub !== userId) throw new ForbiddenException('You can only view your own balance.');
    const balance = await this.freelancersService.getAvailableBalance(userId);
    return { balance };
  }

  @Roles('freelancer')
  @Get(':userId/withdrawals')
  @ApiOperation({ summary: 'Get freelancer withdrawal history log' })
  @ApiResponse({ status: 200, description: 'Returns list of past withdrawals.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getWithdrawals(
    @Param('userId') userId: string,
    @Req() req: FastifyRequest & { user: { sub: string } },
  ) {
    if (req.user.sub !== userId) throw new ForbiddenException('You can only view your own withdrawals.');
    return this.freelancersService.getWithdrawals(userId);
  }
}
