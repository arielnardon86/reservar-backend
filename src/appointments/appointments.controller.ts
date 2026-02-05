import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly prisma: PrismaService,
  ) {}

  // Público: Obtener disponibilidad
  @Get('availability')
  async getAvailability(
    @Query('tenantSlug') tenantSlug: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    console.log('📅 Availability Request:', {
      tenantSlug,
      query,
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error('❌ Tenant not found:', tenantSlug);
      throw new NotFoundException('Tenant not found');
    }

    console.log('✅ Tenant found:', tenant.id, tenant.name);

    try {
      const result = await this.appointmentsService.getAvailability(tenant.id, query);
      console.log('✅ Availability result:', {
        totalSlots: result?.length || 0,
        availableSlots: result?.filter(s => s.available).length || 0,
        allSlots: result?.slice(0, 5), // Primeros 5 slots para debug
      });
      return result;
    } catch (error) {
      console.error('❌ Error in getAvailability:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      if (error instanceof NotFoundException) throw error;
      // Evitar 500: devolver [] para que el frontend no rompa
      return [];
    }
  }

  // Público: Obtener appointments del día (para visualización)
  @Get('day')
  async getDayAppointments(
    @Query('tenantSlug') tenantSlug: string,
    @Query('date') date: string,
  ) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      return this.appointmentsService.getDayAppointments(tenant.id, date);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error in getDayAppointments:', error);
      return [];
    }
  }

  // Público: Crear appointment (cliente reserva turno)
  @Post()
  async create(
    @Query('tenantSlug') tenantSlug: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    try {
      console.log('📝 Creating appointment:', {
        tenantSlug,
        professionalId: createAppointmentDto.professionalId,
        serviceId: createAppointmentDto.serviceId,
        startTime: createAppointmentDto.startTime,
        customerEmail: createAppointmentDto.customerEmail,
      });

      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const appointment = await this.appointmentsService.create(tenant.id, createAppointmentDto);
      
      console.log('✅ Appointment created successfully:', appointment.id);
      return appointment;
    } catch (error) {
      console.error('❌ Error creating appointment:', {
        error: error.message,
        stack: error.stack,
        tenantSlug,
        createAppointmentDto,
      });
      throw error;
    }
  }

  // Admin: Listar appointments
  @Get()
  @UseGuards(TenantGuard)
  findAll(
    @TenantId() tenantId: string,
    @Query('professionalId') professionalId?: string,
    @Query('status') status?: string,
  ) {
    return this.appointmentsService.findAll(tenantId, {
      professionalId,
      status: status as any,
    });
  }

  // Admin: Obtener appointment por ID
  @Get(':id')
  @UseGuards(TenantGuard)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.appointmentsService.findOne(id, tenantId);
  }

  // Admin: Cancelar appointment
  @Patch(':id/cancel')
  @UseGuards(TenantGuard)
  cancel(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentsService.cancel(id, tenantId, reason, 'admin');
  }

  // Admin: Eliminar appointment
  @Delete(':id')
  @UseGuards(TenantGuard)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.appointmentsService.remove(id, tenantId);
  }
}

