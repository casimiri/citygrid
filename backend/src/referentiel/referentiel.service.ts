import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class ReferentielService {
  constructor(private supabaseService: SupabaseService) {}

  async getEquipmentCategories(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('equipment_category')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data;
  }

  async getEquipmentTypes(orgId: string, categoryId?: string) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('equipment_type')
      .select(`
        *,
        category:equipment_category(*),
        thresholds:threshold(*),
        area_requirements:area_requirement(*)
      `)
      .eq('org_id', orgId);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch equipment types: ${error.message}`);
    }

    return data;
  }

  async getThresholds(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('threshold')
      .select(`
        *,
        equipment_type:equipment_type_id(*)
      `)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch thresholds: ${error.message}`);
    }

    return data;
  }

  async checkConformity(orgId: string, checkData: any) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase.rpc('check_project_conformity', {
      org_id: orgId,
      project_data: checkData
    });

    if (error) {
      throw new Error(`Conformity check failed: ${error.message}`);
    }

    return data;
  }
}