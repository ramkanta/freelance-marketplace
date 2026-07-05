import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private clientInstance: SupabaseClient;
  private adminClientInstance: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !anonKey || !serviceKey) {
      throw new Error('Missing Supabase configurations in environment variables.');
    }

    // 1. Regular Client (Respects RLS rules)
    this.clientInstance = createClient(url, anonKey);

    // 2. Admin Client (Bypasses RLS rules, server-only)
    this.adminClientInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Returns standard client instance (RLS applies)
   */
  getClient(): SupabaseClient {
    return this.clientInstance;
  }

  /**
   * Returns administrative client instance (Bypasses RLS)
   */
  getAdminClient(): SupabaseClient {
    return this.adminClientInstance;
  }
}
