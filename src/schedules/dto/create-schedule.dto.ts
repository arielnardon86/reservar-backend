import { IsInt, IsString, IsOptional, IsBoolean, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsOptional()
  professionalId?: string; // Si es null, es horario global

  @IsInt()
  @Min(0)
  @Max(6)
  @IsNotEmpty()
  dayOfWeek: number; // 0-6 (Domingo-Sábado)

  @IsString()
  @IsNotEmpty()
  startTime: string; // "09:00"

  @IsString()
  @IsNotEmpty()
  endTime: string; // "18:00"

  @IsOptional()
  breaks?: any; // JSON

  @IsBoolean()
  @IsOptional()
  isException?: boolean;

  @IsOptional()
  exceptionDate?: Date;
}


