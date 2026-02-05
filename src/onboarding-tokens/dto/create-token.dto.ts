import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOnboardingTokenDto {
  /** Clave secreta para autorizar la creación (ONBOARDING_ADMIN_SECRET) */
  @IsString()
  @IsNotEmpty()
  adminSecret: string;
}
