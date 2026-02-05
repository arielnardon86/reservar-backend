import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { OnboardingTokensService } from './onboarding-tokens.service';
import { CreateOnboardingTokenDto } from './dto/create-token.dto';

@Controller('onboarding-tokens')
export class OnboardingTokensController {
  constructor(private readonly onboardingTokensService: OnboardingTokensService) {}

  /** Público: valida si un token es válido y no usado */
  @Get('validate')
  async validate(@Query('token') token: string) {
    return this.onboardingTokensService.validate(token || '');
  }

  /** Requiere adminSecret: crea un nuevo token de un solo uso */
  @Post()
  async create(@Body() dto: CreateOnboardingTokenDto) {
    return this.onboardingTokensService.create(dto.adminSecret);
  }
}
