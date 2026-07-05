import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FreelancersService } from './freelancers.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Freelancers')
@Controller('api/v1/freelancers')
export class FreelancersController {
  constructor(private readonly freelancersService: FreelancersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a freelancer profile' })
  @ApiResponse({ status: 201, description: 'Freelancer profile successfully created.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 409, description: 'Freelancer profile already exists for this user.' })
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    return this.freelancersService.createProfile(createProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all freelancer profiles' })
  @ApiResponse({ status: 200, description: 'Returns lists of freelancers joined with user name/email.' })
  async findAll() {
    return this.freelancersService.findAll();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Retrieve a freelancer profile by user ID' })
  @ApiResponse({ status: 200, description: 'Returns freelancer profile details.' })
  @ApiResponse({ status: 404, description: 'Freelancer profile not found.' })
  async getProfile(@Param('userId') userId: string) {
    return this.freelancersService.getProfile(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update a freelancer profile' })
  @ApiResponse({ status: 200, description: 'Freelancer profile successfully updated.' })
  @ApiResponse({ status: 404, description: 'Freelancer profile not found.' })
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.freelancersService.updateProfile(userId, updateProfileDto);
  }
}
