import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { OnboardingTokensModule } from '../onboarding-tokens/onboarding-tokens.module';

@Module({
  imports: [OnboardingTokensModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}


