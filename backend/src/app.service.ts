import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class AppService {
  constructor(private readonly supabaseService: SupabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // 1. Supabase Query Builder: INSERT
  async createTest(message: string, status = 'pending', payload?: Record<string, any>, ipAddress?: string): Promise<any> {
    const client = this.supabaseService.getAdminClient(); // Bypasses RLS for testing/admin ops
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

  // 2. Supabase Query Builder: Bulk INSERT
  async createBulkTests(messages: string[]): Promise<any[]> {
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

  // 3. Supabase Query Builder: UPDATE
  async updateStatus(id: number, status: string): Promise<any> {
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

  // 4. Supabase Query Builder: SELECT *
  async getTests(): Promise<any[]> {
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
}
