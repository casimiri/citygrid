import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { OrgService } from './org.service';

@ApiTags('Organization')
@Controller('org')
@UseGuards(JwtAuthGuard, OrgGuard)
@ApiBearerAuth()
export class OrgController {
  constructor(private orgService: OrgService) {}

  @Get()
  @ApiOperation({ summary: 'Get current organization details' })
  async getCurrentOrg(@CurrentUser() user: JwtPayload) {
    return this.orgService.getOrganization(user.org_id);
  }

  @Get('members')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(@CurrentUser() user: JwtPayload) {
    return this.orgService.getMembers(user.org_id);
  }
}