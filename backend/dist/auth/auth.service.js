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
const supabase_service_1 = require("../supabase.service");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    supabaseService;
    jwtService;
    constructor(supabaseService, jwtService) {
        this.supabaseService = supabaseService;
        this.jwtService = jwtService;
    }
    async signup(signupDto) {
        const client = this.supabaseService.getAdminClient();
        const { email, password, name, role } = signupDto;
        const { data: existingUser } = await client
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists.');
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
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
            throw new common_1.ConflictException(`Failed to create user: ${insertError.message}`);
        }
        const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
        return {
            user: newUser,
            accessToken: this.jwtService.sign(payload),
        };
    }
    async login(loginDto) {
        const client = this.supabaseService.getAdminClient();
        const { email, password } = loginDto;
        const { data: user } = await client
            .from('users')
            .select('id, email, password_hash, name, role')
            .eq('email', email)
            .maybeSingle();
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map