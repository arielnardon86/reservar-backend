import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los tenants con estadísticas
   */
  async getAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            services: true,
            appointments: true,
            customers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tenants.map(tenant => ({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      stats: {
        users: tenant._count.users,
        services: tenant._count.services,
        appointments: tenant._count.appointments,
        customers: tenant._count.customers,
      },
    }));
  }

  /**
   * Obtener un tenant específico con detalles completos
   */
  async getTenantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            isActive: true,
            duration: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            customers: true,
            schedules: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${tenantId} no encontrado`);
    }

    return tenant;
  }

  /**
   * Inactivar un tenant (soft delete)
   */
  async deactivateTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${tenantId} no encontrado`);
    }

    if (!tenant.isActive) {
      throw new BadRequestException('El tenant ya está inactivo');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
    });
  }

  /**
   * Activar un tenant
   */
  async activateTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${tenantId} no encontrado`);
    }

    if (tenant.isActive) {
      throw new BadRequestException('El tenant ya está activo');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: true },
    });
  }

  /**
   * Eliminar un tenant permanentemente (hard delete)
   * ⚠️ ADVERTENCIA: Esto eliminará todos los datos relacionados (cascade)
   */
  async deleteTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            appointments: true,
            customers: true,
            services: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${tenantId} no encontrado`);
    }

    // Eliminar tenant (cascade eliminará relaciones)
    await this.prisma.tenant.delete({
      where: { id: tenantId },
    });

    return {
      message: `Tenant "${tenant.name}" eliminado permanentemente`,
      deletedStats: {
        appointments: tenant._count.appointments,
        customers: tenant._count.customers,
        services: tenant._count.services,
      },
    };
  }

  /**
   * Obtener estadísticas globales del sistema
   */
  async getSystemStats() {
    const [
      totalTenants,
      activeTenants,
      inactiveTenants,
      totalUsers,
      totalAppointments,
      totalCustomers,
      totalServices,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.tenant.count({ where: { isActive: false } }),
      this.prisma.user.count(),
      this.prisma.appointment.count(),
      this.prisma.customer.count(),
      this.prisma.service.count(),
    ]);

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        inactive: inactiveTenants,
      },
      users: {
        total: totalUsers,
      },
      appointments: {
        total: totalAppointments,
      },
      customers: {
        total: totalCustomers,
      },
      services: {
        total: totalServices,
      },
    };
  }
}
