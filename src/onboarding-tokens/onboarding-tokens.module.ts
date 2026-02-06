import { Module } from '@nestjs/common';
import { OnboardingTokensController } from './onboarding-tokens.controller';
import { OnboardingTokensService } from './onboarding-tokens.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OnboardingTokensController],
  providers: [OnboardingTokensService],
  exports: [OnboardingTokensService],
})
export class OnboardingTokensModule {}
