import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReferentielController } from './referentiel.controller';
import { ReferentielService } from './referentiel.service';

@Module({
  imports: [AuthModule],
  controllers: [ReferentielController],
  providers: [ReferentielService],
})
export class ReferentielModule {}