import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createScheduleDto: CreateScheduleDto) {
    const isGlobal = !createScheduleDto.professionalId && !createScheduleDto.serviceId;
    return this.prisma.schedule.create({
      data: {
        ...createScheduleDto,
        tenantId: isGlobal ? tenantId : null,
      },
    });
  }

  async createMany(tenantId: string, schedules: CreateScheduleDto[]) {
    return this.prisma.schedule.createMany({
      data: schedules.map(schedule => {
        const isGlobal = !schedule.professionalId && !schedule.serviceId;
        return { ...schedule, tenantId: isGlobal ? tenantId : null };
      }),
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.schedule.findMany({
      where: {
        OR: [
          { tenantId, professionalId: null, serviceId: null },
          { professionalId: { not: null }, professional: { tenantId } },
          { serviceId: { not: null }, service: { tenantId } },
        ],
      },
      include: {
        professional: {
          select: { id: true, firstName: true, lastName: true, fullName: true },
        },
        service: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByService(serviceId: string) {
    return this.prisma.schedule.findMany({
      where: { serviceId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByProfessional(professionalId: string) {
    return this.prisma.schedule.findMany({
      where: { professionalId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async update(id: string, tenantId: string, updateData: Partial<CreateScheduleDto>) {
    const data: any = { ...updateData };
    const isGlobal = (data.professionalId === null || data.professionalId === '') &&
      (data.serviceId === null || data.serviceId === '');
    if (isGlobal) {
      data.tenantId = tenantId;
      data.professionalId = null;
      data.serviceId = null;
    } else {
      data.tenantId = null;
    }
    return this.prisma.schedule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}

