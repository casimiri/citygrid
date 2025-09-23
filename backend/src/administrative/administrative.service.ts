import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

export interface AdministrativeLevel {
  id: string;
  state_id: string;
  name: string;
  code: string;
  level_order: number;
  color: string;
  icon: string;
  requires_parent: boolean;
  metadata: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdministrativeNode {
  id: string;
  state_id: string;
  parent_id?: string;
  level_id: string;
  name: string;
  code?: string;
  description?: string;
  population?: number;
  area_sqm?: number;
  location?: any;
  boundaries?: any;
  metadata: any;
  active: boolean;
  created_at: string;
  updated_at: string;
  level?: AdministrativeLevel;
  children?: AdministrativeNode[];
  parent?: AdministrativeNode;
}

export interface AdministrativeTreeNode extends AdministrativeNode {
  children: AdministrativeTreeNode[];
  level: AdministrativeLevel;
  depth: number;
  path: string[];
}

export interface CreateAdministrativeLevelDto {
  name: string;
  code: string;
  level_order: number;
  color?: string;
  icon?: string;
  requires_parent?: boolean;
  metadata?: any;
}

export interface CreateAdministrativeNodeDto {
  parent_id?: string;
  level_id: string;
  name: string;
  code?: string;
  description?: string;
  population?: number;
  area_sqm?: number;
  location?: any;
  boundaries?: any;
  metadata?: any;
}

@Injectable()
export class AdministrativeService {
  constructor(private readonly supabase: SupabaseService) {}

  private async ensureStateAccess(stateId: string, user: JwtPayload) {
    // For now, allow access to administrative structure for all authenticated users
    // In a production system, this would check if the user's organization
    // has permissions to access this state's administrative structure

    // Verify the state exists
    const { data: state, error } = await this.supabase.getClient()
      .from('org')
      .select('id')
      .eq('id', stateId)
      .eq('is_state', true)
      .single();

    if (error || !state) {
      throw new ForbiddenException('État non trouvé ou accès non autorisé');
    }
  }

  async getAdministrativeLevels(stateId: string, user: JwtPayload): Promise<AdministrativeLevel[]> {
    await this.ensureStateAccess(stateId, user);

    const { data, error } = await this.supabase.getClient()
      .from('administrative_level')
      .select('*')
      .eq('state_id', stateId)
      .eq('active', true)
      .order('level_order');

    if (error) throw error;
    return data || [];
  }

  async createAdministrativeLevel(
    stateId: string,
    createDto: CreateAdministrativeLevelDto,
    user: JwtPayload
  ): Promise<AdministrativeLevel> {
    await this.ensureStateAccess(stateId, user);

    const { data, error } = await this.supabase.getClient()
      .from('administrative_level')
      .insert({
        state_id: stateId,
        ...createDto,
        color: createDto.color || '#6366f1',
        icon: createDto.icon || 'map',
        requires_parent: createDto.requires_parent !== false,
        metadata: createDto.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAdministrativeLevel(
    stateId: string,
    levelId: string,
    updateDto: Partial<CreateAdministrativeLevelDto>,
    user: JwtPayload
  ): Promise<AdministrativeLevel> {
    await this.ensureStateAccess(stateId, user);

    // Vérifier que le niveau existe et appartient à l'État
    const { data: existingLevel, error: checkError } = await this.supabase.getClient()
      .from('administrative_level')
      .select('id')
      .eq('id', levelId)
      .eq('state_id', stateId)
      .single();

    if (checkError || !existingLevel) {
      throw new NotFoundException('Niveau administratif non trouvé');
    }

    const { data, error } = await this.supabase.getClient()
      .from('administrative_level')
      .update(updateDto)
      .eq('id', levelId)
      .eq('state_id', stateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAdministrativeLevel(
    stateId: string,
    levelId: string,
    user: JwtPayload
  ): Promise<void> {
    await this.ensureStateAccess(stateId, user);

    // Vérifier que le niveau existe et appartient à l'État
    const { data: existingLevel, error: checkError } = await this.supabase.getClient()
      .from('administrative_level')
      .select('id')
      .eq('id', levelId)
      .eq('state_id', stateId)
      .single();

    if (checkError || !existingLevel) {
      throw new NotFoundException('Niveau administratif non trouvé');
    }

    // Vérifier qu'aucun nœud n'utilise ce niveau
    const { data: nodes, error: nodesError } = await this.supabase.getClient()
      .from('administrative_node')
      .select('id')
      .eq('level_id', levelId)
      .limit(1);

    if (nodesError) throw nodesError;

    if (nodes && nodes.length > 0) {
      throw new ForbiddenException('Impossible de supprimer ce niveau car il est utilisé par des nœuds administratifs');
    }

    const { error } = await this.supabase.getClient()
      .from('administrative_level')
      .delete()
      .eq('id', levelId)
      .eq('state_id', stateId);

    if (error) throw error;
  }

  async getAdministrativeTree(stateId: string, user: JwtPayload): Promise<AdministrativeTreeNode[]> {
    await this.ensureStateAccess(stateId, user);

    // Récupérer tous les nœuds avec leurs niveaux
    const { data: nodes, error: nodesError } = await this.supabase.getClient()
      .from('administrative_node')
      .select(`
        *,
        level:administrative_level(*)
      `)
      .eq('state_id', stateId)
      .eq('active', true)
      .order('name');

    if (nodesError) throw nodesError;

    return this.buildTree(nodes || []);
  }

  private buildTree(nodes: any[]): AdministrativeTreeNode[] {
    const nodeMap = new Map<string, AdministrativeTreeNode>();
    const rootNodes: AdministrativeTreeNode[] = [];

    // Créer une map de tous les nœuds
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        children: [],
        depth: 0,
        path: []
      });
    });

    // Construire l'arbre
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!;
      
      if (node.parent_id) {
        const parent = nodeMap.get(node.parent_id);
        if (parent) {
          parent.children.push(treeNode);
          treeNode.depth = parent.depth + 1;
          treeNode.path = [...parent.path, parent.name];
        }
      } else {
        rootNodes.push(treeNode);
        treeNode.path = [];
      }
    });

    return rootNodes.sort((a, b) => a.level.level_order - b.level.level_order);
  }

  async getAdministrativeNode(nodeId: string, user: JwtPayload): Promise<AdministrativeNode> {
    const { data, error } = await this.supabase.getClient()
      .from('administrative_node')
      .select(`
        *,
        level:administrative_level(*),
        parent:parent_id(id, name, level:administrative_level(name))
      `)
      .eq('id', nodeId)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException('Nœud administratif non trouvé');

    await this.ensureStateAccess(data.state_id, user);
    return data;
  }

  async createAdministrativeNode(
    stateId: string,
    createDto: CreateAdministrativeNodeDto,
    user: JwtPayload
  ): Promise<AdministrativeNode> {
    await this.ensureStateAccess(stateId, user);

    // Vérifier que le niveau existe et appartient à l'État
    const { data: level, error: levelError } = await this.supabase.getClient()
      .from('administrative_level')
      .select('*')
      .eq('id', createDto.level_id)
      .eq('state_id', stateId)
      .single();

    if (levelError || !level) {
      throw new NotFoundException('Niveau administratif non trouvé');
    }

    // Si un parent est spécifié, vérifier qu'il existe et appartient à l'État
    if (createDto.parent_id) {
      const { data: parent, error: parentError } = await this.supabase.getClient()
        .from('administrative_node')
        .select('id')
        .eq('id', createDto.parent_id)
        .eq('state_id', stateId)
        .single();

      if (parentError || !parent) {
        throw new NotFoundException('Nœud parent non trouvé');
      }
    }

    const { data, error } = await this.supabase.getClient()
      .from('administrative_node')
      .insert({
        state_id: stateId,
        ...createDto,
        metadata: createDto.metadata || {}
      })
      .select(`
        *,
        level:administrative_level(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async getNodeChildren(nodeId: string, user: JwtPayload): Promise<AdministrativeNode[]> {
    // D'abord récupérer le nœud pour vérifier l'accès
    const node = await this.getAdministrativeNode(nodeId, user);

    const { data, error } = await this.supabase.getClient()
      .from('administrative_node')
      .select(`
        *,
        level:administrative_level(*)
      `)
      .eq('parent_id', nodeId)
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getNodeHierarchy(nodeId: string, user: JwtPayload): Promise<AdministrativeNode[]> {
    // D'abord récupérer le nœud pour vérifier l'accès
    const node = await this.getAdministrativeNode(nodeId, user);

    const { data, error } = await this.supabase.getClient()
      .rpc('get_administrative_hierarchy', { node_uuid: nodeId });

    if (error) throw error;
    return data || [];
  }

  async getNodeSubtree(nodeId: string, user: JwtPayload): Promise<AdministrativeNode[]> {
    // D'abord récupérer le nœud pour vérifier l'accès
    const node = await this.getAdministrativeNode(nodeId, user);

    const { data, error } = await this.supabase.getClient()
      .rpc('get_administrative_subtree', { node_uuid: nodeId });

    if (error) throw error;
    return data || [];
  }

  async updateAdministrativeNode(
    nodeId: string,
    updateDto: Partial<CreateAdministrativeNodeDto>,
    user: JwtPayload
  ): Promise<AdministrativeNode> {
    // D'abord récupérer le nœud pour vérifier l'accès
    const existingNode = await this.getAdministrativeNode(nodeId, user);

    const { data, error } = await this.supabase.getClient()
      .from('administrative_node')
      .update(updateDto)
      .eq('id', nodeId)
      .select(`
        *,
        level:administrative_level(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAdministrativeNode(nodeId: string, user: JwtPayload): Promise<void> {
    // D'abord récupérer le nœud pour vérifier l'accès
    const node = await this.getAdministrativeNode(nodeId, user);

    // Vérifier qu'il n'y a pas d'enfants
    const children = await this.getNodeChildren(nodeId, user);
    if (children.length > 0) {
      throw new ForbiddenException('Impossible de supprimer un nœud qui a des enfants');
    }

    const { error } = await this.supabase.getClient()
      .from('administrative_node')
      .update({ active: false })
      .eq('id', nodeId);

    if (error) throw error;
  }

  async getNodeProjects(nodeId: string, includeChildren: boolean, user: JwtPayload) {
    // D'abord récupérer le nœud pour vérifier l'accès
    const node = await this.getAdministrativeNode(nodeId, user);

    let nodeIds = [nodeId];

    if (includeChildren) {
      const subtree = await this.getNodeSubtree(nodeId, user);
      nodeIds = subtree.map(n => n.id);
    }

    const { data, error } = await this.supabase.getClient()
      .from('project')
      .select(`
        *,
        administrative_node:administrative_node_id(
          id,
          name,
          level:administrative_level(name)
        )
      `)
      .in('administrative_node_id', nodeIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async assignUserToNode(
    nodeId: string,
    userId: string,
    role: string,
    scope: 'node' | 'subtree' = 'node',
    user: JwtPayload
  ) {
    // D'abord récupérer le nœud pour vérifier l'accès
    const node = await this.getAdministrativeNode(nodeId, user);

    const { data, error } = await this.supabase.getClient()
      .from('administrative_user')
      .upsert({
        user_id: userId,
        node_id: nodeId,
        role,
        scope,
        appointed_by: user.sub,
        active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserAdministrativeNodes(userId: string, stateId: string, user: JwtPayload) {
    await this.ensureStateAccess(stateId, user);

    const { data, error } = await this.supabase.getClient()
      .from('administrative_user')
      .select(`
        *,
        node:administrative_node(
          *,
          level:administrative_level(*)
        )
      `)
      .eq('user_id', userId)
      .eq('active', true);

    if (error) throw error;
    return data || [];
  }
}