import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrgModule } from '../org/org.module';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [AuthModule, OrgModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}