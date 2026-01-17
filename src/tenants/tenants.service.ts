import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    try {
      console.log('📝 Creating tenant with data:', JSON.stringify(createTenantDto, null, 2));
      
      // Crear tenant y usuario admin en una transacción
      return await this.prisma.$transaction(async (tx) => {
        // 1. Crear tenant
        console.log('1️⃣ Creating tenant...');
        const tenant = await tx.tenant.create({
          data: {
            ...createTenantDto,
            primaryColor: createTenantDto.primaryColor || '#3b82f6',
            timezone: createTenantDto.timezone || 'America/Argentina/Buenos_Aires',
            locale: createTenantDto.locale || 'es-AR',
          },
        });
        console.log('✅ Tenant created:', tenant.id);

        // 2. Crear usuario admin automáticamente usando el email del tenant
        console.log('2️⃣ Creating admin user...');
        await tx.user.create({
          data: {
            email: createTenantDto.email,
            name: createTenantDto.name, // Usar el nombre del negocio como nombre del usuario
            tenantId: tenant.id,
            role: 'admin',
          },
        });
        console.log('✅ Admin user created');

        return tenant;
      });
    } catch (error) {
      console.error('❌ Error creating tenant:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      throw error;
    }
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        phone: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        createdAt: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        phone: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        timezone: true,
        locale: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }

    return tenant;
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}

