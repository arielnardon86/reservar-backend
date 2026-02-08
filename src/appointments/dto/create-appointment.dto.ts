import { IsString, IsDateString, IsOptional, IsEnum, IsNotEmpty, IsEmail } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  // Datos del cliente (si no existe, se crea)
  @IsString()
  @IsNotEmpty()
  customerFirstName: string;

  @IsString()
  @IsNotEmpty()
  customerLastName: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  // Datos de la reserva: espacio común (serviceId) es obligatorio
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  // Opcional: para edificios/condominios solo se usa serviceId (espacio)
  @IsString()
  @IsOptional()
  professionalId?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string; // ISO string

  /** Opcional: si se envía (ej. reserva dentro de turno ya empezado), se usa en lugar de startTime + duración del espacio */
  @IsDateString()
  @IsOptional()
  endTime?: string; // ISO string

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  // Datos del departamento (edificios/condominios)
  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  piso?: string;
}

