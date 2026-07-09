import { Controller, Post, Get, Patch, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from './public.decorator';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Returns user profile, accessToken, and refreshToken.' })
  @ApiResponse({ status: 409, description: 'Email address already exists.' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Public()
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT + refresh token' })
  @ApiResponse({ status: 200, description: 'Returns user profile, accessToken, and refreshToken.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Throttle({ global: { ttl: 60_000, limit: 20 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue new access + refresh tokens' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  // ─── Forgot / Reset Password ─────────────────────────────────────────────────

  @Public()
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post('reset-password')
  @ApiOperation({ summary: 'Verify OTP and set new password' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─── Authenticated Profile ────────────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user name' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, dto);
  }
}
