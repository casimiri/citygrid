import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

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

  async create(
    orgId: string,
    createdBy: string,
    projectData: {
      name: string;
      description: string;
      address?: string;
      area_sqm?: number;
      status?: string;
      project_type?: string;
      administrative_node_id?: string;
      area_requirement_ids?: string[];
    },
    user?: JwtPayload
  ) {
    // Use service role client - it should bypass RLS but apparently doesn't for this table
    const supabase = this.supabaseService.getClient();

    // First, create the project
    const { data: project, error: projectError } = await supabase
      .from('project')
      .insert({
        org_id: orgId,
        created_by: createdBy,
        name: projectData.name,
        description: projectData.description,
        address: projectData.address,
        area_sqm: projectData.area_sqm,
        status: projectData.status || 'draft',
        project_type: projectData.project_type || 'new',
        administrative_node_id: projectData.administrative_node_id
      })
      .select('*')
      .single();

    if (projectError) {
      throw new Error(`Failed to create project: ${projectError.message}`);
    }

    // Then, if area requirements are provided, create the junction records
    if (projectData.area_requirement_ids && projectData.area_requirement_ids.length > 0) {
      const junctionRecords = projectData.area_requirement_ids.map(areaReqId => ({
        project_id: project.id,
        area_requirement_id: areaReqId
      }));

      const { error: junctionError } = await supabase
        .from('project_area_requirement')
        .insert(junctionRecords);

      if (junctionError) {
        // If junction creation fails, we should ideally rollback the project creation
        // For now, we'll just log the error and return the project
        console.error('Failed to create project-area requirement associations:', junctionError.message);
      }
    }

    // Return the project with equipment instances
    const { data: finalProject, error: selectError } = await supabase
      .from('project')
      .select(`
        *,
        equipment_instances:equipment_instance(*)
      `)
      .eq('id', project.id)
      .single();

    if (selectError) {
      throw new Error(`Failed to fetch created project: ${selectError.message}`);
    }

    return finalProject;
  }
}