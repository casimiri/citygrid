import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private supabaseService: SupabaseService) {}

  async getCoverage(orgId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase.rpc('get_coverage_analytics', {
      org_id: orgId
    });

    if (error) {
      throw new Error(`Failed to fetch coverage data: ${error.message}`);
    }

    return data;
  }

  async getDashboardKPIs(orgId: string) {
    const supabase = this.supabaseService.getClient();

    const [projectsCount, equipmentCount, coverageData] = await Promise.all([
      supabase.from('project').select('id', { count: 'exact' }).eq('org_id', orgId),
      supabase.from('equipment_instance').select('id', { count: 'exact' }).eq('org_id', orgId),
      this.getCoverage(orgId)
    ]);

    const totalProjects = projectsCount.count || 0;
    const totalEquipments = equipmentCount.count || 0;
    const coveragePercentage = this.calculateCoveragePercentage(coverageData);
    const nonCompliantItems = this.calculateNonCompliantItems(coverageData);

    return {
      totalProjects,
      totalEquipments,
      coveragePercentage,
      nonCompliantItems,
      lastUpdated: new Date().toISOString(),
    };
  }

  private calculateCoveragePercentage(coverageData: any[]): number {
    if (!coverageData || coverageData.length === 0) return 0;
    
    const total = coverageData.reduce((sum, item) => sum + item.required, 0);
    const covered = coverageData.reduce((sum, item) => sum + Math.min(item.current, item.required), 0);
    
    return total > 0 ? Math.round((covered / total) * 100) : 0;
  }

  private calculateNonCompliantItems(coverageData: any[]): number {
    if (!coverageData || coverageData.length === 0) return 0;
    
    return coverageData.filter(item => item.current < item.required).length;
  }
}