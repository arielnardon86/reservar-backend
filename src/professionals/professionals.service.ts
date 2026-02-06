import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createProfessionalDto: CreateProfessionalDto) {
    const { serviceIds, ...professionalData } = createProfessionalDto;
    
    const fullName = `${createProfessionalDto.firstName} ${createProfessionalDto.lastName}`;
    
    const professional = await this.prisma.professional.create({
      data: {
        ...professionalData,
        fullName,
        tenantId,
        isActive: createProfessionalDto.isActive ?? true,
        services: serviceIds && serviceIds.length > 0 ? {
          create: serviceIds.map(serviceId => ({
            serviceId,
          })),
        } : undefined,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return professional;
  }

  async findAll(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(tenantId: string) {
    return this.prisma.professional.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const professional = await this.prisma.professional.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!professional) {
      throw new NotFoundException(`Professional with ID "${id}" not found`);
    }

    return professional;
  }

  async update(id: string, tenantId: string, updateProfessionalDto: UpdateProfessionalDto) {
    await this.findOne(id, tenantId);

    const { serviceIds, ...professionalData } = updateProfessionalDto;
    
    // Si se actualiza nombre, recalcular fullName
    if (updateProfessionalDto.firstName || updateProfessionalDto.lastName) {
      const current = await this.findOne(id, tenantId);
      const firstName = updateProfessionalDto.firstName || current.firstName;
      const lastName = updateProfessionalDto.lastName || current.lastName;
      professionalData['fullName'] = `${firstName} ${lastName}`;
    }

    // Actualizar servicios si se proporcionan
    if (serviceIds !== undefined) {
      // Eliminar relaciones existentes
      await this.prisma.professionalService.deleteMany({
        where: { professionalId: id },
      });

      // Crear nuevas relaciones
      if (serviceIds.length > 0) {
        await this.prisma.professionalService.createMany({
          data: serviceIds.map(serviceId => ({
            professionalId: id,
            serviceId,
          })),
        });
      }
    }

    return this.prisma.professional.update({
      where: { id },
      data: professionalData,
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.professional.delete({
      where: { id },
    });
  }
}


