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
    try {
      console.log('🔵 Starting appointment creation transaction:', {
        tenantId,
        serviceId: createAppointmentDto.serviceId,
        professionalId: createAppointmentDto.professionalId,
        startTime: createAppointmentDto.startTime,
      });

      // Usar transacción para prevenir race conditions
      // Aumentar timeout a 10 segundos para evitar problemas de timeout
      return await this.prisma.$transaction(async (tx) => {
        // Obtener el servicio para calcular endTime
        const service = await tx.service.findUnique({
          where: { id: createAppointmentDto.serviceId },
        });

        if (!service) {
          console.error('❌ Service not found:', createAppointmentDto.serviceId);
          throw new NotFoundException('Service not found');
        }

        console.log('✅ Service found:', { id: service.id, duration: service.duration });

        const startTime = new Date(createAppointmentDto.startTime);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + service.duration);
        
        console.log('⏰ Calculated times:', {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });

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

      const professionalIdOrNull = createAppointmentDto.professionalId ?? null;

      // Verificar duplicados exactos (mismo cliente, mismo horario)
      const duplicateAppointment = await tx.appointment.findFirst({
        where: {
          tenantId,
          customerId: customer.id,
          serviceId: createAppointmentDto.serviceId,
          ...(professionalIdOrNull ? { professionalId: professionalIdOrNull } : { professionalId: null }),
          status: {
            not: AppointmentStatus.CANCELLED,
          },
          startTime: {
            gte: new Date(startTime.getTime() - 60000),
            lte: new Date(startTime.getTime() + 60000),
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

      // Verificar conflictos de horario (mismo espacio/recurso ya reservado)
      const conflicting = await tx.appointment.findFirst({
        where: {
          tenantId,
          serviceId: createAppointmentDto.serviceId,
          ...(professionalIdOrNull ? { professionalId: professionalIdOrNull } : { professionalId: null }),
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
        console.log('📝 Creating appointment in transaction...');
        const appointment = await tx.appointment.create({
          data: {
            tenantId,
            customerId: customer.id,
            serviceId: createAppointmentDto.serviceId,
            professionalId: professionalIdOrNull,
            startTime,
            endTime,
            status: createAppointmentDto.status || AppointmentStatus.PENDING,
            notes: createAppointmentDto.notes,
            departamento: createAppointmentDto.departamento,
            piso: createAppointmentDto.piso,
          },
          include: {
            customer: true,
            service: true,
            professional: true,
          },
        });

        console.log('✅ Appointment created in transaction:', appointment.id);
        return appointment;
      }, {
        maxWait: 10000, // Esperar hasta 10 segundos para que la transacción comience
        timeout: 10000, // Timeout de 10 segundos para la transacción completa
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
    } catch (error) {
      console.error('❌ Error in create appointment:', {
        error: error.message,
        stack: error.stack,
        tenantId,
        createAppointmentDto,
      });
      throw error;
    }
  }

  async getAvailability(tenantId: string, query: AvailabilityQueryDto) {
    console.log('🔍 getAvailability called with:', { tenantId, query });

    try {
      return await this.getAvailabilityInternal(tenantId, query);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      console.error('❌ getAvailability error:', err);
      console.error('❌ getAvailability stack:', err instanceof Error ? err.stack : '');
      return [];
    }
  }

  private async getAvailabilityInternal(tenantId: string, query: AvailabilityQueryDto) {
    // Parsear fecha correctamente (formato ISO: 'YYYY-MM-DD')
    if (!query.date) {
      throw new Error('Date is required');
    }

    const dateParts = query.date.split('-');
    if (dateParts.length !== 3) {
      throw new Error(`Invalid date format: ${query.date}. Expected YYYY-MM-DD`);
    }

    // Crear fecha en UTC para evitar problemas de timezone
    // Usar Date.UTC para crear la fecha en UTC
    const date = new Date(Date.UTC(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1, // Mes es 0-indexed
      parseInt(dateParts[2]),
    ));

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${query.date}`);
    }
    
    // Crear startOfDay y endOfDay en UTC
    const startOfDay = new Date(Date.UTC(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      23, 59, 59, 999
    ));

    console.log('📅 Parsed date:', {
      input: query.date,
      parsed: date.toISOString(),
      parsedUTC: date.toUTCString(),
      dayOfWeek: date.getUTCDay(),
    });

    // Verificar que el espacio (service) pertenezca al tenant
    const service = await this.prisma.service.findFirst({
      where: {
        id: query.serviceId,
        tenantId,
        isActive: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Espacio no encontrado');
    }

    const dayOfWeek = date.getUTCDay();
    const bySpaceOnly = !query.professionalId;

    let schedules: { id: string; startTime: string; endTime: string; dayOfWeek: number; professionalId: string | null; serviceId: string | null; tenantId: string | null }[];

    if (bySpaceOnly) {
      // Reservas de espacios comunes: horarios del espacio (serviceId)
      const spaceSchedules = await this.prisma.schedule.findMany({
        where: {
          serviceId: query.serviceId,
          dayOfWeek,
          isException: false,
        },
      });
      const globalSchedules = await this.prisma.schedule.findMany({
        where: {
          tenantId,
          serviceId: null,
          professionalId: null,
          dayOfWeek,
          isException: false,
        },
      });
      schedules = spaceSchedules.length > 0 ? spaceSchedules : globalSchedules;
    } else {
      // Flujo con profesional/recurso
      const professional = await this.prisma.professional.findFirst({
        where: { id: query.professionalId, tenantId },
      });
      if (!professional) throw new NotFoundException('Recurso no encontrado');

      const professionalSchedules = await this.prisma.schedule.findMany({
        where: {
          professionalId: query.professionalId,
          dayOfWeek,
          isException: false,
        },
      });
      const globalSchedules = await this.prisma.schedule.findMany({
        where: {
          tenantId,
          professionalId: null,
          serviceId: null,
          dayOfWeek,
          isException: false,
        },
      });
      schedules = professionalSchedules.length > 0 ? professionalSchedules : globalSchedules;
    }

    console.log('🔍 Availability:', {
      tenantId,
      serviceId: query.serviceId,
      bySpaceOnly,
      schedulesFound: schedules.length,
    });

    if (schedules.length === 0) {
      return []; // No hay horarios configurados
    }

    const appointmentsWhere: any = {
      tenantId,
      serviceId: query.serviceId,
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
    };
    if (bySpaceOnly) {
      appointmentsWhere.professionalId = null;
    } else {
      appointmentsWhere.professionalId = query.professionalId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: appointmentsWhere,
      orderBy: { startTime: 'asc' },
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
    const serviceDuration = service.duration || 30;

    console.log('⏱️ Service duration:', serviceDuration, 'minutes');
    console.log('📅 Existing appointments:', appointments.length);

    // Helper: parse "HH:mm" o "HH:mm:ss" -> [hour, minute] o null si inválido
    const parseTime = (s: string): [number, number] | null => {
      if (typeof s !== 'string' || !s.trim()) return null;
      const parts = s.trim().split(':').map(Number);
      if (parts.length < 2 || parts.some(n => isNaN(n))) return null;
      const [h, m] = parts;
      if (h < 0 || h > 23 || m < 0 || m > 59) return null;
      return [h, m];
    };

    // Por cada schedule, generar slots
    for (const schedule of schedules) {
      const startParsed = parseTime(schedule?.startTime);
      const endParsed = parseTime(schedule?.endTime);
      if (!startParsed || !endParsed) {
        console.warn('⚠️ Invalid schedule times, skipping:', { id: schedule?.id, startTime: schedule?.startTime, endTime: schedule?.endTime });
        continue;
      }
      const [startHour, startMinute] = startParsed;
      const [endHour, endMinute] = endParsed;

      // Crear fechas en UTC para evitar problemas de timezone
      const scheduleStart = new Date(Date.UTC(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        startHour,
        startMinute,
        0,
        0
      ));
      const scheduleEnd = new Date(Date.UTC(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        endHour,
        endMinute,
        0,
        0
      ));

      console.log(`📋 Processing schedule: ${schedule.startTime} - ${schedule.endTime}`);
      console.log(`   Schedule start: ${scheduleStart.toISOString()}`);
      console.log(`   Schedule end: ${scheduleEnd.toISOString()}`);

      let currentTime = new Date(scheduleStart);
      let slotsGenerated = 0;

      while (currentTime < scheduleEnd) {
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

        if (slotEnd > scheduleEnd) break;

        // Usar UTC para la hora mostrada (para evitar problemas de timezone)
        const timeString = `${currentTime.getUTCHours().toString().padStart(2, '0')}:${currentTime.getUTCMinutes().toString().padStart(2, '0')}`;

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
        // Comparar en UTC para evitar problemas de timezone
        const now = new Date();
        const nowUTC = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds()
        ));
        const isPast = currentTime.getTime() < nowUTC.getTime();

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

  // Público: Obtener appointments del día (solo para visualización, sin datos sensibles)
  async getDayAppointments(tenantId: string, date: string) {
    const dateParts = date.split('-');
    if (dateParts.length !== 3) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
    }

    const startOfDay = new Date(Date.UTC(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      23, 59, 59, 999
    ));

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      select: {
        id: true,
        serviceId: true,
        professionalId: true,
        startTime: true,
        endTime: true,
        service: {
          select: {
            duration: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return appointments;
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
