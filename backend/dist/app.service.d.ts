import { SupabaseService } from './supabase.service';
export declare class AppService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    getHello(): string;
    createTest(message: string, status?: string, payload?: Record<string, any>, ipAddress?: string): Promise<any>;
    createBulkTests(messages: string[]): Promise<any[]>;
    updateStatus(id: number, status: string): Promise<any>;
    getTests(): Promise<any[]>;
}
