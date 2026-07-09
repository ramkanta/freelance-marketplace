import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase.service';
import { EmailService } from '../email/email.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const REFRESH_TOKEN_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateAccessToken(payload: { sub: string; email: string; role: string }) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });
  }

  private generateRawRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await this.supabaseService.getAdminClient()
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token_hash: this.hashToken(rawToken),
        expires_at: expiresAt.toISOString(),
      });
  }

  private async issueTokenPair(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(payload);
    const rawRefreshToken = this.generateRawRefreshToken();
    await this.storeRefreshToken(user.id, rawRefreshToken);
    return { accessToken, refreshToken: rawRefreshToken };
  }

  // ─── Public methods ───────────────────────────────────────────────────────

  async signup(signupDto: SignupDto) {
    const client = this.supabaseService.getAdminClient();
    const { email, password, name, role } = signupDto;

    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) throw new ConflictException('User with this email already exists.');

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await client
      .from('users')
      .insert({ email, password_hash: passwordHash, name, role: role || 'customer' })
      .select('id, email, name, role, created_at')
      .single();

    if (insertError) throw new ConflictException(`Failed to create user: ${insertError.message}`);

    const tokens = await this.issueTokenPair(newUser);

    // Fire-and-forget — never block signup on email failure
    this.emailService.sendWelcome(newUser.email, newUser.name, newUser.role).catch(() => {});

    return { user: newUser, ...tokens };
  }

  async login(loginDto: LoginDto) {
    const client = this.supabaseService.getAdminClient();
    const { email, password } = loginDto;

    const { data: user, error } = await client
      .from('users')
      .select('id, email, password_hash, name, role, is_banned')
      .eq('email', email)
      .maybeSingle();

    // Log column errors in dev but don't expose them — surface as 401
    if (error) {
      console.error('Login query error:', error.message);
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user) throw new UnauthorizedException('Invalid email or password.');

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password.');

    if (user.is_banned) throw new UnauthorizedException('Your account has been suspended. Contact support.');

    const tokens = await this.issueTokenPair(user);

    this.emailService.sendLoginAlert(user.email, user.name).catch(() => {});

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const client = this.supabaseService.getAdminClient();

    const { data: stored } = await client
      .from('refresh_tokens')
      .select('id, user_id, expires_at, revoked')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (!stored) throw new UnauthorizedException('Invalid refresh token.');
    if (stored.revoked) throw new UnauthorizedException('Refresh token has been revoked.');
    if (new Date(stored.expires_at) < new Date()) throw new UnauthorizedException('Refresh token has expired.');

    // Rotate: revoke old token
    await client
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('id', stored.id);

    const { data: user } = await client
      .from('users')
      .select('id, email, name, role, is_banned')
      .eq('id', stored.user_id)
      .single();

    if (!user) throw new UnauthorizedException('User not found.');
    if (user.is_banned) throw new UnauthorizedException('Your account has been suspended.');

    // Issue new pair
    const tokens = await this.issueTokenPair(user);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async logout(rawToken: string) {
    if (!rawToken) return { message: 'Logged out.' };
    const tokenHash = this.hashToken(rawToken);
    await this.supabaseService.getAdminClient()
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('token_hash', tokenHash);
    return { message: 'Logged out successfully.' };
  }
}
