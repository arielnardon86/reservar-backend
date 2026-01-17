import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        ...createServiceDto,
        tenantId,
        isActive: createServiceDto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(tenantId: string) {
    return this.prisma.service.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const service = await this.prisma.service.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }

    return service;
  }

  async update(id: string, tenantId: string, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id, tenantId); // Verificar que existe y pertenece al tenant

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // Verificar que existe y pertenece al tenant

    return this.prisma.service.delete({
      where: { id },
    });
  }
}


