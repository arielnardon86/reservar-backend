import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingTokensService } from '../onboarding-tokens/onboarding-tokens.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private onboardingTokensService: OnboardingTokensService,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    try {
      const { password, inviteToken, ...tenantData } = createTenantDto;

      // Si hay inviteToken, validar que sea válido y no usado
      if (inviteToken) {
        const { valid } = await this.onboardingTokensService.validate(inviteToken);
        if (!valid) {
          throw new BadRequestException('El link de suscripción no es válido o ya fue utilizado');
        }
      }
      if (!password || password.length < 8) {
        throw new BadRequestException('La contraseña es obligatoria y debe tener al menos 8 caracteres');
      }
      const passwordHash = await bcrypt.hash(password, 10);

      console.log('📝 Creating tenant with data:', JSON.stringify(tenantData, null, 2));

      return await this.prisma.$transaction(async (tx) => {
        console.log('1️⃣ Creating tenant...');
        const tenant = await tx.tenant.create({
          data: {
            ...tenantData,
            primaryColor: tenantData.primaryColor || '#3b82f6',
            timezone: tenantData.timezone || 'America/Argentina/Buenos_Aires',
            locale: tenantData.locale || 'es-AR',
          },
        });
        console.log('✅ Tenant created:', tenant.id);

        console.log('2️⃣ Creating admin user with password...');
        await tx.user.create({
          data: {
            email: tenantData.email,
            name: tenantData.name,
            tenantId: tenant.id,
            role: 'admin',
            passwordHash,
          },
        });
        console.log('✅ Admin user created');

        // Marcar token como usado (si se proporcionó)
        if (inviteToken) {
          await this.onboardingTokensService.markAsUsed(inviteToken, tenant.id);
          console.log('✅ Onboarding token marked as used');
        }

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
        address: true,
        latitude: true,
        longitude: true,
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
        address: true,
        latitude: true,
        longitude: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        timezone: true,
        locale: true,
        isActive: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }

    // Los tenants inactivos no deben ser accesibles públicamente
    if (!tenant.isActive) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }

    // No devolver isActive en la respuesta pública
    const { isActive, ...publicTenant } = tenant;
    return publicTenant;
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

