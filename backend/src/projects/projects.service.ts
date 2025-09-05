import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class ProjectsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('project')
      .select(`
        *,
        equipment_instances:equipment_instance(*)
      `)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data;
  }

  async findOne(orgId: string, projectId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('project')
      .select(`
        *,
        equipment_instances:equipment_instance(*),
        attachments:attachment(*)
      `)
      .eq('org_id', orgId)
      .eq('id', projectId)
      .single();

    if (error) {
      throw new Error(`Project not found: ${error.message}`);
    }

    return data;
  }
}