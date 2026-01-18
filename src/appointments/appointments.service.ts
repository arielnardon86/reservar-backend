import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(tenantId: string, createAppointmentDto: CreateAppointmentDto) {
    // Usar transacción para prevenir race conditions
    return await this.prisma.$transaction(async (tx) => {
      // Obtener el servicio para calcular endTime
      const service = await tx.service.findUnique({
        where: { id: createAppointmentDto.serviceId },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      const startTime = new Date(createAppointmentDto.startTime);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);

      // Primero, obtener o crear el customer para verificar duplicados
      const customer = await tx.customer.upsert({
        where: {
          tenantId_email: {
            tenantId,
            email: createAppointmentDto['customerEmail'] || 'unknown@example.com',
          },
        },
        update: {},
        create: {
          tenantId,
          firstName: createAppointmentDto['customerFirstName'] || 'Cliente',
          lastName: createAppointmentDto['customerLastName'] || 'Anónimo',
          email: createAppointmentDto['customerEmail'] || 'unknown@example.com',
        },
      });

      // Verificar duplicados exactos PRIMERO (mismo cliente, mismo horario)
      // Buscar turnos del mismo cliente en el mismo horario (ventana de 1 minuto)
      const duplicateAppointment = await tx.appointment.findFirst({
        where: {
          tenantId,
          customerId: customer.id,
          professionalId: createAppointmentDto.professionalId,
          status: {
            not: AppointmentStatus.CANCELLED,
          },
          startTime: {
            gte: new Date(startTime.getTime() - 60000), // 1 minuto antes
            lte: new Date(startTime.getTime() + 60000), // 1 minuto después
          },
        },
      });

      if (duplicateAppointment) {
        console.warn('⚠️ Duplicate appointment found:', {
          duplicateId: duplicateAppointment.id,
          duplicateStart: duplicateAppointment.startTime,
          newStart: startTime,
          customerId: customer.id,
          customerEmail: customer.email,
        });
        throw new ConflictException('Ya tienes un turno reservado en este horario. Por favor verifica tus turnos.');
      }

      // Verificar conflictos de horario (turnos que se solapan con otros clientes)
      const conflicting = await tx.appointment.findFirst({
        where: {
          tenantId,
          professionalId: createAppointmentDto.professionalId,
          status: {
            not: AppointmentStatus.CANCELLED,
          },
          OR: [
            // El nuevo turno empieza durante un turno existente
            {
              startTime: {
                lte: startTime,
              },
              endTime: {
                gt: startTime,
              },
            },
            // El nuevo turno termina durante un turno existente
            {
              startTime: {
                lt: endTime,
              },
              endTime: {
                gte: endTime,
              },
            },
            // El nuevo turno contiene completamente un turno existente
            {
              startTime: {
                gte: startTime,
              },
              endTime: {
                lte: endTime,
              },
            },
          ],
        },
      });

      if (conflicting) {
        console.warn('⚠️ Conflicting appointment found:', {
          conflictingId: conflicting.id,
          conflictingStart: conflicting.startTime,
          conflictingEnd: conflicting.endTime,
          newStart: startTime,
          newEnd: endTime,
        });
        throw new ConflictException('Este horario ya está reservado. Por favor selecciona otro horario.');
      }

      // Crear appointment dentro de la transacción
      const appointment = await tx.appointment.create({
        data: {
          tenantId,
          customerId: customer.id,
          serviceId: createAppointmentDto.serviceId,
          professionalId: createAppointmentDto.professionalId,
          startTime,
          endTime,
          status: createAppointmentDto.status || AppointmentStatus.PENDING,
          notes: createAppointmentDto.notes,
        },
        include: {
          customer: true,
          service: true,
          professional: true,
        },
      });

      return appointment;
    }).then(async (appointment) => {
      // Enviar email de confirmación después de que la transacción se complete
      // No bloquear si falla
      try {
        await this.notificationsService.sendAppointmentConfirmation(appointment.id);
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        // No fallar la creación del appointment si el email falla
      }
      return appointment;
    });
  }

  async getAvailability(tenantId: string, query: AvailabilityQueryDto) {
    console.log('🔍 getAvailability called with:', { tenantId, query });

    // Parsear fecha correctamente (formato ISO: 'YYYY-MM-DD')
    if (!query.date) {
      throw new Error('Date is required');
    }

    const dateParts = query.date.split('-');
    if (dateParts.length !== 3) {
      throw new Error(`Invalid date format: ${query.date}. Expected YYYY-MM-DD`);
    }

    const date = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1, // Mes es 0-indexed
      parseInt(dateParts[2]),
    );

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${query.date}`);
    }
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('📅 Parsed date:', {
      input: query.date,
      parsed: date.toISOString(),
      dayOfWeek: date.getDay(),
    });

    // Verificar que el profesional pertenezca al tenant
    const professional = await this.prisma.professional.findFirst({
      where: {
        id: query.professionalId,
        tenantId,
      },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    // Obtener horarios del profesional o globales del tenant
    // getDay() retorna 0 (Domingo) a 6 (Sábado)
    const dayOfWeek = date.getDay();
    
    console.log('🔍 Searching schedules:', {
      tenantId,
      professionalId: query.professionalId,
      dayOfWeek,
    });

    // Buscar horarios específicos del profesional primero
    const professionalSchedules = await this.prisma.schedule.findMany({
      where: {
        professionalId: query.professionalId,
        dayOfWeek,
        isException: false,
      },
    });

    console.log('👤 Professional schedules found:', professionalSchedules.length);
    if (professionalSchedules.length > 0) {
      console.log('👤 Professional schedules details:', professionalSchedules.map(s => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        dayOfWeek: s.dayOfWeek,
      })));
    }

    // Buscar horarios globales del tenant
    const globalSchedules = await this.prisma.schedule.findMany({
      where: {
        tenantId,
        professionalId: null,
        dayOfWeek,
        isException: false,
      },
    });

    console.log('🌐 Global schedules found:', globalSchedules.length);
    if (globalSchedules.length > 0) {
      console.log('🌐 Global schedules details:', globalSchedules.map(s => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        dayOfWeek: s.dayOfWeek,
      })));
    }

    // Combinar ambos tipos de horarios
    // Si hay horarios específicos del profesional, usar solo esos
    // Si no, usar los horarios globales
    const schedules = professionalSchedules.length > 0 
      ? professionalSchedules 
      : globalSchedules;

    // Debug: Log para verificar qué horarios se encontraron
    console.log('🔍 Availability Debug:', {
      tenantId,
      professionalId: query.professionalId,
      date: query.date,
      dayOfWeek,
      schedulesFound: schedules.length,
      professionalSchedulesCount: professionalSchedules.length,
      globalSchedulesCount: globalSchedules.length,
      usingProfessionalSchedules: professionalSchedules.length > 0,
      schedules: schedules.map(s => ({
        id: s.id,
        professionalId: s.professionalId,
        tenantId: s.tenantId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isException: s.isException,
      })),
    });

    if (schedules.length === 0) {
      return []; // No hay horarios configurados
    }

    // Obtener appointments existentes (incluyendo PENDING, CONFIRMED, COMPLETED)
    // Excluir solo CANCELLED y NO_SHOW
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId: query.professionalId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    console.log(`📅 Found ${appointments.length} existing appointments for ${query.date}:`, 
      appointments.map(apt => ({
        id: apt.id,
        startTime: apt.startTime.toISOString(),
        endTime: apt.endTime.toISOString(),
        status: apt.status,
      }))
    );

    // Generar slots disponibles
    const slots: { time: string; available: boolean }[] = [];
    const serviceDuration = query.serviceId
      ? (await this.prisma.service.findUnique({ where: { id: query.serviceId } }))?.duration || 30
      : 30;

    console.log('⏱️ Service duration:', serviceDuration, 'minutes');
    console.log('📅 Existing appointments:', appointments.length);

    // Por cada schedule, generar slots
    for (const schedule of schedules) {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

      const scheduleStart = new Date(date);
      scheduleStart.setHours(startHour, startMinute, 0, 0);
      const scheduleEnd = new Date(date);
      scheduleEnd.setHours(endHour, endMinute, 0, 0);

      console.log(`📋 Processing schedule: ${schedule.startTime} - ${schedule.endTime}`);
      console.log(`   Schedule start: ${scheduleStart.toISOString()}`);
      console.log(`   Schedule end: ${scheduleEnd.toISOString()}`);

      let currentTime = new Date(scheduleStart);
      let slotsGenerated = 0;

      while (currentTime < scheduleEnd) {
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

        if (slotEnd > scheduleEnd) break;

        const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

        // Verificar si hay conflicto con appointments existentes
        const hasConflict = appointments.some(apt => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          return (
            (currentTime >= aptStart && currentTime < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (currentTime <= aptStart && slotEnd >= aptEnd)
          );
        });

        // Verificar que no sea en el pasado
        const now = new Date();
        const isPast = currentTime.getTime() < now.getTime();

        const available = !hasConflict && !isPast;

        // Debug para los primeros slots
        if (slots.length < 3) {
          console.log(`   Slot ${timeString}: available=${available}, hasConflict=${hasConflict}, isPast=${isPast}`);
          console.log(`      currentTime: ${currentTime.toISOString()}, now: ${now.toISOString()}`);
        }

        slots.push({
          time: timeString,
          available,
        });

        slotsGenerated++;

        // Incrementar por la duración del servicio (o 30 min mínimo)
        currentTime.setMinutes(currentTime.getMinutes() + Math.max(serviceDuration, 30));
      }

      console.log(`   Generated ${slotsGenerated} slots from this schedule`);
    }

    // Eliminar slots duplicados (mismo tiempo)
    // Usar un Map para mantener solo el último slot de cada tiempo
    const uniqueSlotsMap = new Map<string, { time: string; available: boolean }>();
    
    for (const slot of slots) {
      // Si ya existe un slot con este tiempo, mantener el que tenga available=true si es posible
      const existing = uniqueSlotsMap.get(slot.time);
      if (!existing || (slot.available && !existing.available)) {
        uniqueSlotsMap.set(slot.time, slot);
      }
    }
    
    const uniqueSlots = Array.from(uniqueSlotsMap.values());
    const availableSlots = uniqueSlots.filter(s => s.available);
    const unavailableSlots = uniqueSlots.filter(s => !s.available);
    
    console.log(`✅ Total slots generated: ${slots.length}`);
    console.log(`✅ Unique slots: ${uniqueSlots.length}`);
    console.log(`✅ Available slots: ${availableSlots.length}`);
    console.log(`❌ Unavailable slots: ${unavailableSlots.length}`);
    
    if (availableSlots.length > 0) {
      console.log(`📊 First 10 available slots:`, availableSlots.slice(0, 10).map(s => s.time));
    } else {
      console.warn('⚠️ NO AVAILABLE SLOTS FOUND!');
      console.log('📊 First 10 unavailable slots (for debugging):', unavailableSlots.slice(0, 10).map(s => ({
        time: s.time,
        available: s.available,
      })));
    }

    return uniqueSlots;
  }

  async findAll(tenantId: string, filters?: {
    professionalId?: string;
    status?: AppointmentStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(filters?.professionalId && { professionalId: filters.professionalId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && filters?.endDate && {
          startTime: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        customer: true,
        service: true,
        professional: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: true,
        service: true,
        professional: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID "${id}" not found`);
    }

    return appointment;
  }

  async cancel(id: string, tenantId: string, reason?: string, cancelledBy?: string) {
    await this.findOne(id, tenantId);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: cancelledBy || 'admin',
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.appointment.delete({
      where: { id },
    });
  }
}
