"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase.service");
const email_service_1 = require("../email/email.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const REFRESH_TOKEN_DAYS = 30;
const BCRYPT_ROUNDS = 12;
const SELF_SERVICE_ROLES = ['customer', 'freelancer'];
let AuthService = class AuthService {
    supabaseService;
    jwtService;
    configService;
    emailService;
    constructor(supabaseService, jwtService, configService, emailService) {
        this.supabaseService = supabaseService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    generateAccessToken(payload) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '1d',
        });
    }
    generateRawRefreshToken() {
        return crypto.randomBytes(48).toString('hex');
    }
    hashToken(raw) {
        return crypto.createHash('sha256').update(raw).digest('hex');
    }
    async storeRefreshToken(userId, rawToken) {
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
    async issueTokenPair(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.generateAccessToken(payload);
        const rawRefreshToken = this.generateRawRefreshToken();
        await this.storeRefreshToken(user.id, rawRefreshToken);
        return { accessToken, refreshToken: rawRefreshToken };
    }
    async signup(signupDto) {
        const client = this.supabaseService.getAdminClient();
        const { email, password, name, role } = signupDto;
        const { data: existingUser } = await client
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (existingUser)
            throw new common_1.ConflictException('User with this email already exists.');
        const safeRole = SELF_SERVICE_ROLES.includes(role) ? role : 'customer';
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const { data: newUser, error: insertError } = await client
            .from('users')
            .insert({ email, password_hash: passwordHash, name, role: safeRole })
            .select('id, email, name, role, created_at')
            .single();
        if (insertError)
            throw new common_1.ConflictException(`Failed to create user: ${insertError.message}`);
        const tokens = await this.issueTokenPair(newUser);
        this.emailService.sendWelcome(newUser.email, newUser.name, newUser.role).catch(() => { });
        return { user: newUser, ...tokens };
    }
    async login(loginDto) {
        const client = this.supabaseService.getAdminClient();
        const { email, password } = loginDto;
        const { data: user, error } = await client
            .from('users')
            .select('id, email, password_hash, name, role, is_banned')
            .eq('email', email)
            .maybeSingle();
        if (error) {
            console.error('Login query error:', error.message);
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (!user)
            throw new common_1.UnauthorizedException('Invalid email or password.');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid)
            throw new common_1.UnauthorizedException('Invalid email or password.');
        if (user.is_banned)
            throw new common_1.UnauthorizedException('Your account has been suspended. Contact support.');
        const tokens = await this.issueTokenPair(user);
        this.emailService.sendLoginAlert(user.email, user.name).catch(() => { });
        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            ...tokens,
        };
    }
    async refresh(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        const client = this.supabaseService.getAdminClient();
        const { data: stored } = await client
            .from('refresh_tokens')
            .select('id, user_id, expires_at, revoked')
            .eq('token_hash', tokenHash)
            .maybeSingle();
        if (!stored)
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        if (stored.revoked)
            throw new common_1.UnauthorizedException('Refresh token has been revoked.');
        if (new Date(stored.expires_at) < new Date())
            throw new common_1.UnauthorizedException('Refresh token has expired.');
        await client
            .from('refresh_tokens')
            .update({ revoked: true })
            .eq('id', stored.id);
        const { data: user } = await client
            .from('users')
            .select('id, email, name, role, is_banned')
            .eq('id', stored.user_id)
            .single();
        if (!user)
            throw new common_1.UnauthorizedException('User not found.');
        if (user.is_banned)
            throw new common_1.UnauthorizedException('Your account has been suspended.');
        const tokens = await this.issueTokenPair(user);
        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            ...tokens,
        };
    }
    async logout(rawToken) {
        if (!rawToken)
            return { message: 'Logged out.' };
        const tokenHash = this.hashToken(rawToken);
        await this.supabaseService.getAdminClient()
            .from('refresh_tokens')
            .update({ revoked: true })
            .eq('token_hash', tokenHash);
        return { message: 'Logged out successfully.' };
    }
    async forgotPassword(email) {
        const client = this.supabaseService.getAdminClient();
        const { data: user } = await client
            .from('users')
            .select('id, name, email')
            .eq('email', email)
            .maybeSingle();
        const SAFE_MSG = { message: 'If this email is registered, a reset code has been sent.' };
        if (!user)
            return SAFE_MSG;
        await client
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('user_id', user.id)
            .eq('used', false);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = this.hashToken(otp);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        await client.from('password_reset_tokens').insert({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt.toISOString(),
        });
        this.emailService.sendPasswordReset(user.email, user.name, otp).catch(() => { });
        return SAFE_MSG;
    }
    async resetPassword(dto) {
        const client = this.supabaseService.getAdminClient();
        const { email, otp, newPassword } = dto;
        const { data: user } = await client
            .from('users')
            .select('id, name, email')
            .eq('email', email)
            .maybeSingle();
        if (!user)
            throw new common_1.BadRequestException('Invalid or expired reset code.');
        const tokenHash = this.hashToken(otp);
        const { data: token } = await client
            .from('password_reset_tokens')
            .select('id, expires_at, used')
            .eq('user_id', user.id)
            .eq('token_hash', tokenHash)
            .maybeSingle();
        if (!token || token.used)
            throw new common_1.BadRequestException('Invalid or expired reset code.');
        if (new Date(token.expires_at) < new Date())
            throw new common_1.BadRequestException('Reset code has expired. Please request a new one.');
        const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await client.from('users').update({ password_hash: passwordHash }).eq('id', user.id);
        await client.from('password_reset_tokens').update({ used: true }).eq('id', token.id);
        await client.from('refresh_tokens').update({ revoked: true }).eq('user_id', user.id);
        this.emailService.sendPasswordChanged(user.email, user.name).catch(() => { });
        return { message: 'Password updated successfully. Please sign in with your new password.' };
    }
    async updateProfile(userId, dto) {
        const client = this.supabaseService.getAdminClient();
        const updates = {};
        if (dto.name)
            updates.name = dto.name;
        if (Object.keys(updates).length === 0) {
            throw new common_1.BadRequestException('No fields provided to update.');
        }
        const { data, error } = await client
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select('id, email, name, role')
            .single();
        if (error)
            throw new common_1.BadRequestException(`Profile update failed: ${error.message}`);
        return data;
    }
    async getProfile(userId) {
        const client = this.supabaseService.getAdminClient();
        const { data, error } = await client
            .from('users')
            .select('id, email, name, role, created_at')
            .eq('id', userId)
            .single();
        if (error || !data)
            throw new common_1.UnauthorizedException('User not found.');
        return data;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map