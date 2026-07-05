"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("./supabase.service");
let AppService = class AppService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    getHello() {
        return 'Hello World!';
    }
    async createTest(message, status = 'pending', payload, ipAddress) {
        const client = this.supabaseService.getAdminClient();
        const { data, error } = await client
            .from('test_connections')
            .insert({ message, status, payload, ip_address: ipAddress })
            .select()
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    async createBulkTests(messages) {
        const client = this.supabaseService.getAdminClient();
        const rows = messages.map(msg => ({
            message: msg,
            status: 'bulk_created',
        }));
        const { data, error } = await client
            .from('test_connections')
            .insert(rows)
            .select();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    async updateStatus(id, status) {
        const client = this.supabaseService.getAdminClient();
        const { data, error } = await client
            .from('test_connections')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
    async getTests() {
        const client = this.supabaseService.getAdminClient();
        const { data, error } = await client
            .from('test_connections')
            .select('*')
            .order('id', { ascending: false });
        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AppService);
//# sourceMappingURL=app.service.js.map