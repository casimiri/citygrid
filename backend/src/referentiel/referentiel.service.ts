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

  async createEquipmentCategory(orgId: string, categoryData: { name: string; description: string; color: string }) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('equipment_category')
      .insert({
        ...categoryData,
        org_id: orgId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
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

  async createEquipmentType(orgId: string, typeData: { name: string; description: string; icon: string; categoryId: string; superficie?: number; thresholdIds?: string[]; areaRequirementIds?: string[]; administrativeLevelIds?: string[] }) {
    const supabase = this.supabaseService.getClient();

    // First create the equipment type
    const { data: equipmentType, error } = await supabase
      .from('equipment_type')
      .insert({
        name: typeData.name,
        description: typeData.description,
        icon: typeData.icon,
        category_id: typeData.categoryId,
        superficie: typeData.superficie,
        org_id: orgId
      })
      .select(`
        *,
        category:equipment_category(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create equipment type: ${error.message}`);
    }

    // Create threshold relationships if provided
    if (typeData.thresholdIds && typeData.thresholdIds.length > 0) {
      const thresholdRelations = typeData.thresholdIds.map(thresholdId => ({
        equipment_type_id: equipmentType.id,
        threshold_id: thresholdId,
        org_id: orgId
      }));

      const { error: thresholdError } = await supabase
        .from('equipment_type_threshold')
        .insert(thresholdRelations);

      if (thresholdError) {
        console.error('Failed to create threshold relations:', thresholdError);
      }
    }

    // Create area requirement relationships if provided
    if (typeData.areaRequirementIds && typeData.areaRequirementIds.length > 0) {
      const areaReqRelations = typeData.areaRequirementIds.map(areaReqId => ({
        equipment_type_id: equipmentType.id,
        area_requirement_id: areaReqId,
        org_id: orgId
      }));

      const { error: areaReqError } = await supabase
        .from('equipment_type_area_requirement')
        .insert(areaReqRelations);

      if (areaReqError) {
        console.error('Failed to create area requirement relations:', areaReqError);
      }
    }

    // Create administrative level relationships if provided
    if (typeData.administrativeLevelIds && typeData.administrativeLevelIds.length > 0) {
      const adminLevelRelations = typeData.administrativeLevelIds.map(levelId => ({
        equipment_type_id: equipmentType.id,
        administrative_level_id: levelId,
        org_id: orgId
      }));

      const { error: adminLevelError } = await supabase
        .from('equipment_type_administrative_level')
        .insert(adminLevelRelations);

      if (adminLevelError) {
        console.error('Failed to create administrative level relations:', adminLevelError);
      }
    }

    return equipmentType;
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

  async getAreaRequirements(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('area_requirement')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch area requirements: ${error.message}`);
    }

    return data;
  }

  async createAreaRequirement(orgId: string, areaReqData: { zone_type: string }) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('area_requirement')
      .insert({
        zone_type: areaReqData.zone_type,
        requirement_per_1000_inhabitants: 0, // Default value since field is required in database
        org_id: orgId,
        equipment_type_id: null // Area requirements are not tied to specific equipment types when created standalone
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create area requirement: ${error.message}`);
    }

    return data;
  }

  async getProgrammingThresholds(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('threshold')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch programming thresholds: ${error.message}`);
    }

    return data;
  }

  async createProgrammingThreshold(orgId: string, thresholdData: { name: string; min_population?: number; max_distance_meters?: number; min_area_sqm?: number }) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('threshold')
      .insert({
        name: thresholdData.name,
        min_population: thresholdData.min_population,
        max_distance_meters: thresholdData.max_distance_meters,
        min_area_sqm: thresholdData.min_area_sqm,
        org_id: orgId,
        equipment_type_id: null // Programming thresholds are not tied to specific equipment types
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create programming threshold: ${error.message}`);
    }

    return data;
  }

  async getAdministrativeLevels(orgId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('administrative_level')
      .select('*')
      .eq('state_id', orgId)
      .eq('active', true)
      .order('level_order');

    if (error) {
      throw new Error(`Failed to fetch administrative levels: ${error.message}`);
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