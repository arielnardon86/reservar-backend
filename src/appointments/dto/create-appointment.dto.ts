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

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

