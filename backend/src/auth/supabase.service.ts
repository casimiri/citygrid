import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async query(query: string, params: any[] = []) {
    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params,
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }
}