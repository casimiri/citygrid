import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { CreateContractDto, AssignManagerDto, ContractStatus } from './dto/create-contract.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ContractsService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
  ) {}

  async createContract(createContractDto: CreateContractDto, createdBy: string) {
    const supabase = this.supabaseService.getClient();
    
    // Verify the government org exists and is a state
    const { data: org, error: orgError } = await supabase
      .from('org')
      .select('id, name, is_state')
      .eq('id', createContractDto.government_org_id)
      .eq('is_state', true)
      .single();

    if (orgError || !org) {
      throw new BadRequestException('Government organization not found or is not a state entity');
    }

    // Check if contract number already exists
    const { data: existingContract } = await supabase
      .from('government_contract')
      .select('id')
      .eq('contract_number', createContractDto.contract_number)
      .single();

    if (existingContract) {
      throw new BadRequestException('Contract number already exists');
    }

    // Create the contract
    const { data: contract, error: contractError } = await supabase
      .from('government_contract')
      .insert({
        ...createContractDto,
        approved_at: createContractDto.signed_date ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (contractError) {
      throw new BadRequestException(`Failed to create contract: ${contractError.message}`);
    }

    // If administrative node IDs are provided, create scope entries
    if (createContractDto.administrative_node_ids?.length) {
      const scopeEntries = createContractDto.administrative_node_ids.map(nodeId => ({
        contract_id: contract.id,
        administrative_node_id: nodeId,
        includes_subtree: true,
      }));

      const { error: scopeError } = await supabase
        .from('contract_administrative_scope')
        .insert(scopeEntries);

      if (scopeError) {
        // Rollback contract creation if scope creation fails
        await supabase.from('government_contract').delete().eq('id', contract.id);
        throw new BadRequestException(`Failed to create contract scope: ${scopeError.message}`);
      }
    }

    // Create audit log
    await this.authService.createAuditLog(
      createContractDto.government_org_id,
      createdBy,
      'CREATE',
      'government_contract',
      null,
      contract
    );

    return this.getContractById(contract.id);
  }

  async assignManager(assignManagerDto: AssignManagerDto, assignedBy: string) {
    const supabase = this.supabaseService.getClient();

    // Verify contract exists
    const { data: contract, error: contractError } = await supabase
      .from('government_contract')
      .select('id, government_org_id')
      .eq('id', assignManagerDto.contract_id)
      .single();

    if (contractError || !contract) {
      throw new NotFoundException('Contract not found');
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('user_profile')
      .select('id, email, full_name')
      .eq('id', assignManagerDto.user_id)
      .single();

    if (userError || !user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already assigned as manager to this contract
    const { data: existingManager } = await supabase
      .from('contract_manager')
      .select('id')
      .eq('contract_id', assignManagerDto.contract_id)
      .eq('user_id', assignManagerDto.user_id)
      .eq('active', true)
      .single();

    if (existingManager) {
      throw new BadRequestException('User is already assigned as manager to this contract');
    }

    // If this is a primary manager, check if one already exists
    if (assignManagerDto.is_primary) {
      const { data: existingPrimary } = await supabase
        .from('contract_manager')
        .select('id')
        .eq('contract_id', assignManagerDto.contract_id)
        .eq('is_primary', true)
        .eq('active', true)
        .single();

      if (existingPrimary) {
        throw new BadRequestException('A primary manager is already assigned to this contract');
      }
    }

    // Create manager assignment
    const { data: manager, error: managerError } = await supabase
      .from('contract_manager')
      .insert({
        ...assignManagerDto,
        appointed_by: assignedBy,
        appointment_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (managerError) {
      throw new BadRequestException(`Failed to assign manager: ${managerError.message}`);
    }

    // Create audit log
    await this.authService.createAuditLog(
      contract.government_org_id,
      assignedBy,
      'CREATE',
      'contract_manager',
      null,
      manager
    );

    return this.getManagerById(manager.id);
  }

  async getContractById(contractId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: contract, error } = await supabase
      .from('government_contract')
      .select(`
        *,
        government_org:government_org_id (
          id,
          name,
          slug,
          country_code,
          state_code
        ),
        contract_administrative_scope (
          id,
          includes_subtree,
          administrative_node:administrative_node_id (
            id,
            name,
            administrative_level:level_id (
              name,
              level_order
            )
          )
        )
      `)
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async getContractManagers(contractId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: managers, error } = await supabase
      .rpc('get_contract_managers', { contract_uuid: contractId });

    if (error) {
      throw new BadRequestException(`Failed to fetch managers: ${error.message}`);
    }

    return managers;
  }

  async getActiveContractsForOrg(orgId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: contracts, error } = await supabase
      .rpc('get_active_contracts', { org_uuid: orgId });

    if (error) {
      throw new BadRequestException(`Failed to fetch contracts: ${error.message}`);
    }

    return contracts;
  }

  async updateContractStatus(contractId: string, status: ContractStatus, updatedBy: string) {
    const supabase = this.supabaseService.getClient();

    // Get current contract for audit log
    const { data: currentContract } = await supabase
      .from('government_contract')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!currentContract) {
      throw new NotFoundException('Contract not found');
    }

    const { data: contract, error } = await supabase
      .from('government_contract')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update contract status: ${error.message}`);
    }

    // Create audit log
    await this.authService.createAuditLog(
      currentContract.government_org_id,
      updatedBy,
      'UPDATE',
      'government_contract',
      { status: currentContract.status },
      { status: contract.status }
    );

    return contract;
  }

  async removeManager(managerId: string, removedBy: string) {
    const supabase = this.supabaseService.getClient();

    // Get manager details for audit log
    const { data: manager, error: managerError } = await supabase
      .from('contract_manager')
      .select(`
        *,
        government_contract:contract_id (
          government_org_id
        )
      `)
      .eq('id', managerId)
      .single();

    if (managerError || !manager) {
      throw new NotFoundException('Manager not found');
    }

    // Deactivate manager instead of deleting
    const { error: updateError } = await supabase
      .from('contract_manager')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', managerId);

    if (updateError) {
      throw new BadRequestException(`Failed to remove manager: ${updateError.message}`);
    }

    // Create audit log
    await this.authService.createAuditLog(
      manager.government_contract.government_org_id,
      removedBy,
      'UPDATE',
      'contract_manager',
      { active: true },
      { active: false }
    );

    return { success: true, message: 'Manager removed successfully' };
  }

  async getManagerById(managerId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: manager, error } = await supabase
      .from('contract_manager')
      .select(`
        *,
        user_profile:user_id (
          id,
          email,
          full_name
        ),
        government_contract:contract_id (
          id,
          title,
          contract_number
        ),
        administrative_node:administrative_scope_node_id (
          id,
          name,
          administrative_level:level_id (
            name,
            level_order
          )
        )
      `)
      .eq('id', managerId)
      .single();

    if (error || !manager) {
      throw new NotFoundException('Manager not found');
    }

    return manager;
  }

  async isContractManager(userId: string, contractId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .rpc('is_contract_manager', { 
        user_uuid: userId, 
        contract_uuid: contractId 
      });

    return data || false;
  }

  async getUserContracts(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: contracts, error } = await supabase
      .from('contract_manager')
      .select(`
        id,
        role,
        is_primary,
        manages_full_contract,
        active,
        government_contract:contract_id (
          id,
          contract_number,
          title,
          status,
          start_date,
          end_date,
          government_org:government_org_id (
            id,
            name,
            slug
          )
        )
      `)
      .eq('user_id', userId)
      .eq('active', true);

    if (error) {
      throw new BadRequestException(`Failed to fetch user contracts: ${error.message}`);
    }

    return contracts;
  }
}