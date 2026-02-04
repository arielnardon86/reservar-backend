import { IsString, IsDateString, IsOptional, IsNotEmpty } from 'class-validator';

export class AvailabilityQueryDto {
  @IsString()
  @IsOptional()
  tenantSlug?: string;

  // Espacio común (obligatorio para reservas de edificios/condominios)
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  // Opcional: recurso/profesional (para flujos que lo usen)
  @IsString()
  @IsOptional()
  professionalId?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string; // ISO date string (yyyy-MM-dd)
}

