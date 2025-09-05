import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, OrgGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('coverage')
  @ApiOperation({ summary: 'Get coverage analytics by equipment type' })
  async getCoverage(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getCoverage(user.org_id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard KPIs' })
  async getDashboardKPIs(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDashboardKPIs(user.org_id);
  }
}