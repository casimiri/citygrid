import { IsString, IsEnum, IsUUID, IsDateString, IsOptional, IsNumber, IsBoolean, IsEmail, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ContractType {
  MUNICIPAL = 'municipal',
  DEPARTMENTAL = 'departmental', 
  REGIONAL = 'regional',
  NATIONAL = 'national',
  CUSTOM = 'custom'
}

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  TERMINATED = 'terminated'
}

export class CreateContractDto {
  @IsString()
  contract_number: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ContractType)
  contract_type: ContractType;

  @IsUUID()
  government_org_id: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  budget_amount?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @IsOptional()
  @IsString()
  scope_description?: string;

  @IsOptional()
  @IsBoolean()
  covers_full_territory?: boolean = false;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus = ContractStatus.DRAFT;

  @IsOptional()
  @IsDateString()
  signed_date?: string;

  @IsOptional()
  @IsString()
  approved_by?: string;

  @IsOptional()
  @IsString()
  legal_framework?: string;

  @IsOptional()
  @IsString()
  contract_terms?: string;

  @IsOptional()
  @IsString()
  renewal_terms?: string;

  @IsOptional()
  @IsString()
  termination_conditions?: string;

  @IsOptional()
  @IsString()
  government_contact_name?: string;

  @IsOptional()
  @IsEmail()
  government_contact_email?: string;

  @IsOptional()
  @IsString()
  government_contact_phone?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  administrative_node_ids?: string[];
}

export class AssignManagerDto {
  @IsUUID()
  contract_id: string;

  @IsUUID()
  user_id: string;

  @IsOptional()
  @IsString()
  role?: string = 'contract_manager';

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean = false;

  @IsOptional()
  @IsUUID()
  administrative_scope_node_id?: string;

  @IsOptional()
  @IsBoolean()
  manages_full_contract?: boolean = true;

  @IsOptional()
  @IsBoolean()
  can_create_admin_tree?: boolean = true;

  @IsOptional()
  @IsBoolean()
  can_assign_users?: boolean = true;

  @IsOptional()
  @IsBoolean()
  can_manage_projects?: boolean = true;

  @IsOptional()
  @IsBoolean()
  can_view_analytics?: boolean = true;

  @IsOptional()
  @IsBoolean()
  can_export_data?: boolean = true;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}