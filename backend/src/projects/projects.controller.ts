import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, OrgGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects for organization' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAll(user.org_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.projectsService.findOne(user.org_id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        address: { type: 'string', description: 'Project address' },
        area_sqm: { type: 'number', description: 'Area in square meters' },
        status: { type: 'string', enum: ['draft', 'active', 'completed', 'cancelled'], description: 'Project status' },
        project_type: { type: 'string', enum: ['new', 'renovation'], description: 'Project type (new or renovation)' },
        administrative_node_id: { type: 'string', description: 'Administrative node ID' },
        area_requirement_ids: { type: 'array', items: { type: 'string' }, description: 'Array of area requirement IDs' }
      },
      required: ['name', 'description']
    }
  })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() projectData: {
      name: string;
      description: string;
      address?: string;
      area_sqm?: number;
      status?: string;
      project_type?: string;
      administrative_node_id?: string;
      area_requirement_ids?: string[];
    }
  ) {
    return this.projectsService.create(user.org_id, user.sub, projectData, user);
  }
}