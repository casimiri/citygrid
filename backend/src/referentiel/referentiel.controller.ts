import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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

  @Post('categories')
  @ApiOperation({ summary: 'Create equipment category' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Category name' },
        description: { type: 'string', description: 'Category description' },
        color: { type: 'string', description: 'Category color (hex)' }
      },
      required: ['name', 'description', 'color']
    }
  })
  async createCategory(
    @CurrentUser() user: JwtPayload,
    @Body() categoryData: { name: string; description: string; color: string }
  ) {
    return this.referentielService.createEquipmentCategory(user.org_id, categoryData);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get equipment types' })
  async getTypes(
    @CurrentUser() user: JwtPayload,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.referentielService.getEquipmentTypes(user.org_id, categoryId);
  }

  @Post('types')
  @ApiOperation({ summary: 'Create equipment type' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Type name' },
        description: { type: 'string', description: 'Type description' },
        icon: { type: 'string', description: 'Type icon' },
        categoryId: { type: 'string', description: 'Category ID' },
        superficie: { type: 'number', description: 'Area in square meters (m²)' },
        thresholdIds: { type: 'array', items: { type: 'string' }, description: 'Programming threshold IDs' },
        areaRequirementIds: { type: 'array', items: { type: 'string' }, description: 'Area requirement IDs' },
        administrativeLevelIds: { type: 'array', items: { type: 'string' }, description: 'Administrative level IDs' }
      },
      required: ['name', 'description', 'icon', 'categoryId']
    }
  })
  async createType(
    @CurrentUser() user: JwtPayload,
    @Body() typeData: { name: string; description: string; icon: string; categoryId: string; superficie?: number; thresholdIds?: string[]; areaRequirementIds?: string[]; administrativeLevelIds?: string[] }
  ) {
    return this.referentielService.createEquipmentType(user.org_id, typeData);
  }

  @Get('thresholds')
  @ApiOperation({ summary: 'Get thresholds' })
  async getThresholds(@CurrentUser() user: JwtPayload) {
    return this.referentielService.getThresholds(user.org_id);
  }

  @Get('area-requirements')
  @ApiOperation({ summary: 'Get area requirements' })
  async getAreaRequirements(@CurrentUser() user: JwtPayload) {
    return this.referentielService.getAreaRequirements(user.org_id);
  }

  @Post('area-requirements')
  @ApiOperation({ summary: 'Create area requirement' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        zone_type: { type: 'string', description: 'Zone type (e.g., residential, commercial, etc.)' }
      },
      required: ['zone_type']
    }
  })
  async createAreaRequirement(
    @CurrentUser() user: JwtPayload,
    @Body() areaReqData: { zone_type: string }
  ) {
    return this.referentielService.createAreaRequirement(user.org_id, areaReqData);
  }

  @Get('programming-thresholds')
  @ApiOperation({ summary: 'Get programming thresholds' })
  async getProgrammingThresholds(@CurrentUser() user: JwtPayload) {
    return this.referentielService.getProgrammingThresholds(user.org_id);
  }

  @Post('programming-thresholds')
  @ApiOperation({ summary: 'Create programming threshold' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Threshold name' },
        min_population: { type: 'number', description: 'Minimum population' },
        max_distance_meters: { type: 'number', description: 'Maximum distance in meters' },
        min_area_sqm: { type: 'number', description: 'Minimum area in square meters' }
      },
      required: ['name']
    }
  })
  async createProgrammingThreshold(
    @CurrentUser() user: JwtPayload,
    @Body() thresholdData: { name: string; min_population?: number; max_distance_meters?: number; min_area_sqm?: number }
  ) {
    return this.referentielService.createProgrammingThreshold(user.org_id, thresholdData);
  }

  @Get('administrative-levels')
  @ApiOperation({ summary: 'Get administrative levels' })
  async getAdministrativeLevels(@CurrentUser() user: JwtPayload) {
    return this.referentielService.getAdministrativeLevels(user.org_id);
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