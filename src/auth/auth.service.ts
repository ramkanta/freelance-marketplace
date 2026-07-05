import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const client = this.supabaseService.getAdminClient();
    const { email, password, name, role } = signupDto;

    // 1. Check if user already exists
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    // 2. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insert user into Database
    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role: role || 'customer',
      })
      .select('id, email, name, role, created_at')
      .single();

    if (insertError) {
      throw new ConflictException(`Failed to create user: ${insertError.message}`);
    }

    // 4. Generate JWT
    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    return {
      user: newUser,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto) {
    const client = this.supabaseService.getAdminClient();
    const { email, password } = loginDto;

    // 1. Find user by email
    const { data: user } = await client
      .from('users')
      .select('id, email, password_hash, name, role')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 3. Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }
}
