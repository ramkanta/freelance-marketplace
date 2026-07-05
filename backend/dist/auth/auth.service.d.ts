import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly supabaseService;
    private readonly jwtService;
    constructor(supabaseService: SupabaseService, jwtService: JwtService);
    signup(signupDto: SignupDto): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            created_at: any;
        };
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
        accessToken: string;
    }>;
}
