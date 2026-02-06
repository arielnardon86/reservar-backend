import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async createOrFind(tenantId: string, createCustomerDto: CreateCustomerDto) {
    // Buscar si ya existe
    const existing = await this.prisma.customer.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: createCustomerDto.email,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Crear nuevo
    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 5, // Últimos 5 turnos
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
        },
      },
    });
  }
}


