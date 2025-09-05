import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { OrgModule } from './org/org.module';
import { ProjectsModule } from './projects/projects.module';
import { ReferentielModule } from './referentiel/referentiel.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StripeModule } from './stripe/stripe.module';
import { AdministrativeModule } from './administrative/administrative.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    OrgModule,
    ProjectsModule,
    ReferentielModule,
    AnalyticsModule,
    StripeModule,
    AdministrativeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}