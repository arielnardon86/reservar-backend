import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AppointmentStatus } from '@prisma/client';

/** Minutos a sumar a medianoche UTC para obtener medianoche en la zona horaria del tenant. */
function getTZOffsetMinutes(year: number, month: number, day: number, timeZone: string): number {
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(utcNoon);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '12', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return (12 - hour) * 60 - minute;
}

/** Día de la semana (0-6, Domingo=0) para la fecha en la zona del tenant. */
function getDayOfWeekInTZ(year: number, month: number, day: number, timeZone: string): number {
  const offsetMin = getTZOffsetMinutes(year, month, day, timeZone);
  const midnightTZUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).getTime() + offsetMin * 60 * 1000;
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
  const short = formatter.format(new Date(midnightTZUtc));
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[short] ?? 0;
}

/** Convierte HH:mm en la zona del tenant (para la fecha dada) a instante UTC (Date). */
function localToUTC(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const offsetMin = getTZOffsetMinutes(year, month, day, timeZone);
  const utcMs =
    new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).getTime() +
    (offsetMin + hour * 60 + minute) * 60 * 1000;
  return new Date(utcMs);
}

/** Formatea un Date UTC como "HH:mm" en la zona del tenant. */
function utcToLocalTimeString(utcDate: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(utcDate);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

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
        let endTime: Date;
        if (createAppointmentDto.endTime) {
          endTime = new Date(createAppointmentDto.endTime);
          if (endTime.getTime() <= startTime.getTime()) {
            throw new ConflictException('La hora de fin debe ser posterior a la hora de inicio');
          }
        } else {
          endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + service.duration);
        }

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

    const baseYear = parseInt(dateParts[0], 10);
    const baseMonth = parseInt(dateParts[1], 10);
    const baseDay = parseInt(dateParts[2], 10);
    const date = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay));

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${query.date}`);
    }

    // Obtener tenant con timezone para interpretar horarios en hora local del edificio
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timezone: true },
    });
    const timeZone = tenant?.timezone ?? 'America/Argentina/Buenos_Aires';

    // Día de la semana en la zona del tenant (para que "sábado" sea el mismo en todo el mundo)
    const dayOfWeek = getDayOfWeekInTZ(baseYear, baseMonth, baseDay, timeZone);

    // startOfDay/endOfDay en UTC para filtrar appointments (se mantiene por día civil UTC para consistencia con BD)
    const startOfDay = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay, 23, 59, 59, 999));

    console.log('📅 Parsed date:', {
      input: query.date,
      timeZone,
      dayOfWeek,
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
      if (spaceSchedules.length > 0) {
        schedules = spaceSchedules;
      } else {
        console.warn('⚠️ No horarios por espacio para este día; usando horarios globales del tenant.');
        schedules = globalSchedules;
      }
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
      date: query.date,
      dayOfWeek,
      bySpaceOnly,
      schedulesFound: schedules.length,
    });
    schedules.forEach((s, i) => {
      console.log(`   Schedule ${i + 1}: ${s.startTime} - ${s.endTime} (dayOfWeek=${s.dayOfWeek})`);
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

    // Paso fijo de 30 min para que el frontend reciba todos los segmentos (11:00, 11:30, 12:00, …)
    // y pueda pintar bien los bloques y permitir reserva dentro de un turno ya empezado
    const slotStepMinutes = 30;

    // Por cada schedule, generar slots en hora local literal cada 30 min
    for (const schedule of schedules) {
      const startParsed = parseTime(schedule?.startTime);
      const endParsed = parseTime(schedule?.endTime);
      if (!startParsed || !endParsed) {
        console.warn('⚠️ Invalid schedule times, skipping:', { id: schedule?.id, startTime: schedule?.startTime, endTime: schedule?.endTime });
        continue;
      }
      let [curHour, curMin] = startParsed;
      const [endHour, endMin] = endParsed;

      const endMinutes = endHour * 60 + endMin + (endHour < startParsed[0] || (endHour === startParsed[0] && endMin <= startParsed[1]) ? 24 * 60 : 0);
      let curMinutes = curHour * 60 + curMin;

      console.log(`📋 Processing schedule: ${schedule.startTime} - ${schedule.endTime} (local)`);

      let slotsGenerated = 0;

      while (curMinutes < endMinutes) {
        // Hora local literal del edificio (11:00, 11:30, 16:00…) — no UTC, para que el frontend muestre lo configurado
        const h = Math.floor((curMinutes % (24 * 60)) / 60);
        const m = curMinutes % 60;
        const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        const curDayOffset = curMinutes >= 24 * 60 ? 1 : 0;
        const slotStartUtc = localToUTC(baseYear, baseMonth, baseDay + curDayOffset, h, m, timeZone);
        const slotEndUtc = new Date(slotStartUtc.getTime() + serviceDuration * 60 * 1000);

        const hasConflict = appointments.some(apt => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          return (
            (slotStartUtc.getTime() >= aptStart.getTime() && slotStartUtc.getTime() < aptEnd.getTime()) ||
            (slotEndUtc.getTime() > aptStart.getTime() && slotEndUtc.getTime() <= aptEnd.getTime()) ||
            (slotStartUtc.getTime() <= aptStart.getTime() && slotEndUtc.getTime() >= aptEnd.getTime())
          );
        });

        // Pasado solo si el FIN del bloque (inicio + duración) es anterior a ahora → permite reservar dentro del turno ya empezado
        const now = new Date();
        const isPast = slotEndUtc.getTime() < now.getTime();

        const available = !hasConflict && !isPast;

        if (slots.length < 3) {
          console.log(`   Slot ${timeString}: available=${available}, hasConflict=${hasConflict}, isPast=${isPast}`);
        }

        slots.push({
          time: timeString,
          available,
        });

        slotsGenerated++;
        curMinutes += slotStepMinutes;
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
    // Ordenar por hora (HH:mm) para que el frontend reciba orden consistente; defensivo con formatos inválidos
    const toMinutes = (t: string): number => {
      if (typeof t !== 'string' || !t.trim()) return 0;
      const parts = t.trim().split(':').map(Number);
      const h = parts[0];
      const m = parts[1] ?? 0;
      if (Number.isNaN(h) || Number.isNaN(m)) return 0;
      return h * 60 + m;
    };
    uniqueSlots.sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

    const availableSlots = uniqueSlots.filter(s => s.available);
    const unavailableSlots = uniqueSlots.filter(s => !s.available);
    
    console.log(`✅ Total slots generated: ${slots.length}`);
    console.log(`✅ Unique slots: ${uniqueSlots.length}`);
    console.log(`✅ Available slots: ${availableSlots.length}`);
    console.log(`❌ Unavailable slots: ${unavailableSlots.length}`);
    
    if (availableSlots.length > 0) {
      console.log(`📊 First 10 available slots:`, availableSlots.slice(0, 10).map(s => s.time));
      if (uniqueSlots.length >= 17) {
        console.log(`📊 Slot 9 (inicio 2º bloque): ${uniqueSlots[8]?.time}, Slot 17 (inicio 3º bloque): ${uniqueSlots[16]?.time}`);
      }
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
