import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ReferentielService } from './referentiel.service';

@ApiTags('Référentiel')
@Controller('referentiel')
@UseGuards(JwtAuthGuard, OrgGuard)
@ApiBearerAuth()
export class ReferentielController {
  constructor(private referentielService: ReferentielService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get equipment categories' })
  async getCategories(@CurrentUser() user: JwtPayload) {
    return this.referentielService.getEquipmentCategories(user.org_id);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get equipment types' })
  async getTypes(
    @CurrentUser() user: JwtPayload,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.referentielService.getEquipmentTypes(user.org_id, categoryId);
  }

  @Get('thresholds')
  @ApiOperation({ summary: 'Get thresholds' })
  async getThresholds(@CurrentUser() user: JwtPayload) {
    return this.referentielService.getThresholds(user.org_id);
  }

  @Post('checks/conformity')
  @ApiOperation({ summary: 'Check project conformity' })
  async checkConformity(
    @CurrentUser() user: JwtPayload,
    @Body() checkData: any,
  ) {
    return this.referentielService.checkConformity(user.org_id, checkData);
  }
}