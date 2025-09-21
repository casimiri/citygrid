import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import {
  AdministrativeService,
  CreateAdministrativeLevelDto,
  CreateAdministrativeNodeDto,
} from './administrative.service';

@ApiTags('Administrative Structure')
@ApiBearerAuth()
@Controller('administrative')
@UseGuards(JwtAuthGuard, OrgGuard)
export class AdministrativeController {
  constructor(private readonly administrativeService: AdministrativeService) {}

  @Get('states/:stateId/levels')
  @ApiOperation({ summary: 'Récupérer les niveaux administratifs d\'un État' })
  @ApiResponse({ status: 200, description: 'Liste des niveaux administratifs' })
  async getAdministrativeLevels(
    @Param('stateId') stateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.getAdministrativeLevels(stateId, user);
  }

  @Post('states/:stateId/levels')
  @ApiOperation({ summary: 'Créer un nouveau niveau administratif' })
  @ApiResponse({ status: 201, description: 'Niveau administratif créé' })
  async createAdministrativeLevel(
    @Param('stateId') stateId: string,
    @Body() createDto: CreateAdministrativeLevelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.createAdministrativeLevel(stateId, createDto, user);
  }

  @Put('states/:stateId/levels/:levelId')
  @ApiOperation({ summary: 'Mettre à jour un niveau administratif' })
  @ApiResponse({ status: 200, description: 'Niveau administratif mis à jour' })
  async updateAdministrativeLevel(
    @Param('stateId') stateId: string,
    @Param('levelId') levelId: string,
    @Body() updateDto: Partial<CreateAdministrativeLevelDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.updateAdministrativeLevel(stateId, levelId, updateDto, user);
  }

  @Delete('states/:stateId/levels/:levelId')
  @ApiOperation({ summary: 'Supprimer un niveau administratif' })
  @ApiResponse({ status: 200, description: 'Niveau administratif supprimé' })
  async deleteAdministrativeLevel(
    @Param('stateId') stateId: string,
    @Param('levelId') levelId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.administrativeService.deleteAdministrativeLevel(stateId, levelId, user);
    return { message: 'Niveau administratif supprimé avec succès' };
  }

  @Get('states/:stateId/tree')
  @ApiOperation({ summary: 'Récupérer l\'arborescence administrative complète d\'un État' })
  @ApiResponse({ status: 200, description: 'Arborescence administrative' })
  async getAdministrativeTree(
    @Param('stateId') stateId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.getAdministrativeTree(stateId, user);
  }

  @Post('states/:stateId/nodes')
  @ApiOperation({ summary: 'Créer un nouveau nœud administratif' })
  @ApiResponse({ status: 201, description: 'Nœud administratif créé' })
  async createAdministrativeNode(
    @Param('stateId') stateId: string,
    @Body() createDto: CreateAdministrativeNodeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.createAdministrativeNode(stateId, createDto, user);
  }

  @Get('nodes/:nodeId')
  @ApiOperation({ summary: 'Récupérer un nœud administratif spécifique' })
  @ApiResponse({ status: 200, description: 'Nœud administratif' })
  async getAdministrativeNode(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.getAdministrativeNode(nodeId, user);
  }

  @Put('nodes/:nodeId')
  @ApiOperation({ summary: 'Mettre à jour un nœud administratif' })
  @ApiResponse({ status: 200, description: 'Nœud administratif mis à jour' })
  async updateAdministrativeNode(
    @Param('nodeId') nodeId: string,
    @Body() updateDto: Partial<CreateAdministrativeNodeDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.updateAdministrativeNode(nodeId, updateDto, user);
  }

  @Delete('nodes/:nodeId')
  @ApiOperation({ summary: 'Supprimer un nœud administratif' })
  @ApiResponse({ status: 200, description: 'Nœud administratif supprimé' })
  async deleteAdministrativeNode(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.administrativeService.deleteAdministrativeNode(nodeId, user);
    return { message: 'Nœud administratif supprimé avec succès' };
  }

  @Get('nodes/:nodeId/children')
  @ApiOperation({ summary: 'Récupérer les enfants directs d\'un nœud' })
  @ApiResponse({ status: 200, description: 'Liste des nœuds enfants' })
  async getNodeChildren(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.getNodeChildren(nodeId, user);
  }

  @Get('nodes/:nodeId/hierarchy')
  @ApiOperation({ summary: 'Récupérer la hiérarchie complète d\'un nœud (parents)' })
  @ApiResponse({ status: 200, description: 'Hiérarchie du nœud' })
  async getNodeHierarchy(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.getNodeHierarchy(nodeId, user);
  }

  @Get('nodes/:nodeId/subtree')
  @ApiOperation({ summary: 'Récupérer tous les descendants d\'un nœud' })
  @ApiResponse({ status: 200, description: 'Sous-arbre du nœud' })
  async getNodeSubtree(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.getNodeSubtree(nodeId, user);
  }

  @Get('nodes/:nodeId/projects')
  @ApiOperation({ summary: 'Récupérer les projets d\'un nœud administratif' })
  @ApiResponse({ status: 200, description: 'Liste des projets' })
  async getNodeProjects(
    @Param('nodeId') nodeId: string,
    @Query('includeChildren') includeChildren: string = 'false',
    @CurrentUser() user: JwtPayload,
  ) {
    const includeChild = includeChildren === 'true';
    return this.administrativeService.getNodeProjects(nodeId, includeChild, user);
  }

  @Post('nodes/:nodeId/users')
  @ApiOperation({ summary: 'Assigner un utilisateur à un nœud administratif' })
  @ApiResponse({ status: 201, description: 'Utilisateur assigné' })
  async assignUserToNode(
    @Param('nodeId') nodeId: string,
    @Body() assignmentDto: {
      user_id: string;
      role: string;
      scope?: 'node' | 'subtree';
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.assignUserToNode(
      nodeId,
      assignmentDto.user_id,
      assignmentDto.role,
      assignmentDto.scope || 'node',
      user,
    );
  }

  @Get('states/:stateId/users/:userId/nodes')
  @ApiOperation({ summary: 'Récupérer les nœuds administratifs d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des nœuds administratifs' })
  async getUserAdministrativeNodes(
    @Param('stateId') stateId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.administrativeService.getUserAdministrativeNodes(userId, stateId, user);
  }
}