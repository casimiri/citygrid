import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Request,
  ParseUUIDPipe,
  BadRequestException 
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ContractsService } from './contracts.service';
import { CreateContractDto, AssignManagerDto, ContractStatus } from './dto/create-contract.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  async createContract(
    @Body() createContractDto: CreateContractDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.createContract(createContractDto, user.sub);
  }

  @Post('assign-manager')
  async assignManager(
    @Body() assignManagerDto: AssignManagerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.assignManager(assignManagerDto, user.sub);
  }

  @Get(':id')
  async getContract(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.getContractById(id);
  }

  @Get(':id/managers')
  async getContractManagers(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.getContractManagers(id);
  }

  @Get('org/:orgId')
  async getOrgContracts(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.contractsService.getActiveContractsForOrg(orgId);
  }

  @Put(':id/status')
  async updateContractStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Validate status
    if (!Object.values(ContractStatus).includes(status as ContractStatus)) {
      throw new BadRequestException('Invalid contract status');
    }

    return this.contractsService.updateContractStatus(id, status as ContractStatus, user.sub);
  }

  @Delete('managers/:managerId')
  async removeManager(
    @Param('managerId', ParseUUIDPipe) managerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.removeManager(managerId, user.sub);
  }

  @Get('managers/:managerId')
  async getManager(@Param('managerId', ParseUUIDPipe) managerId: string) {
    return this.contractsService.getManagerById(managerId);
  }

  @Get('user/contracts')
  async getUserContracts(@CurrentUser() user: JwtPayload) {
    return this.contractsService.getUserContracts(user.sub);
  }

  @Get(':contractId/check-manager')
  async checkIfUserIsManager(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const isManager = await this.contractsService.isContractManager(user.sub, contractId);
    return { isManager };
  }
}