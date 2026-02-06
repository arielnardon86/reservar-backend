import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant.decorator';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // Admin: Obtener horarios globales del tenant
  @Get()
  @UseGuards(TenantGuard)
  findByTenant(@TenantId() tenantId: string) {
    return this.schedulesService.findByTenant(tenantId);
  }

  // Admin: Obtener horarios de un profesional
  @Get('professional/:professionalId')
  @UseGuards(TenantGuard)
  findByProfessional(@Param('professionalId') professionalId: string) {
    return this.schedulesService.findByProfessional(professionalId);
  }

  // Admin: Crear horario
  @Post()
  @UseGuards(TenantGuard)
  create(@TenantId() tenantId: string, @Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(tenantId, createScheduleDto);
  }

  // Admin: Crear múltiples horarios (útil para setup inicial)
  @Post('bulk')
  @UseGuards(TenantGuard)
  createMany(@TenantId() tenantId: string, @Body() schedules: CreateScheduleDto[]) {
    return this.schedulesService.createMany(tenantId, schedules);
  }

  // Admin: Actualizar horario
  @Patch(':id')
  @UseGuards(TenantGuard)
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateData: Partial<CreateScheduleDto>,
  ) {
    return this.schedulesService.update(id, tenantId, updateData);
  }

  // Admin: Eliminar horario
  @Delete(':id')
  @UseGuards(TenantGuard)
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}


