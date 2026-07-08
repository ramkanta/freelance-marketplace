import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
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
  @ApiResponse({ status: 200, description: 'Returns new accessToken and refreshToken (old one is revoked).' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or revoked refresh token.' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
