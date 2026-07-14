import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase.service';
import { EmailService } from '../email/email.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class AuthService {
    private readonly supabaseService;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    constructor(supabaseService: SupabaseService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    private generateAccessToken;
    private generateRawRefreshToken;
    private hashToken;
    private storeRefreshToken;
    private issueTokenPair;
    signup(signupDto: SignupDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            created_at: any;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    refresh(rawToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
    logout(rawToken: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
    }>;
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        name: any;
        role: any;
        created_at: any;
    }>;
}
