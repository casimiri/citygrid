import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class OrgService {
  constructor(private supabaseService: SupabaseService) {}

  async getOrganization(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('org')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) {
      throw new Error(`Organization not found: ${error.message}`);
    }

    return data;
  }

  async updateSubscriptionStatus(orgId: string, status: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('org')
      .update({ subscription_status: status })
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    return data;
  }

  async getMembers(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('membership')
      .select(`
        role,
        created_at,
        user:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    return data;
  }
}