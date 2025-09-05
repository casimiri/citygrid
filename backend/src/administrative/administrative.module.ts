import { Module } from '@nestjs/common';
import { AdministrativeController } from './administrative.controller';
import { AdministrativeService } from './administrative.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdministrativeController],
  providers: [AdministrativeService],
  exports: [AdministrativeService],
})
export class AdministrativeModule {}