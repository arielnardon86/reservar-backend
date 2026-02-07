import { Controller, Get, Param, Patch, Delete, Post, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('super-admin')
@UseGuards(SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  /**
   * Obtener estadísticas globales del sistema
   * GET /super-admin/stats
   */
  @Get('stats')
  async getSystemStats() {
    return this.superAdminService.getSystemStats();
  }

  /**
   * Listar todos los tenants con estadísticas
   * GET /super-admin/tenants
   */
  @Get('tenants')
  async getAllTenants() {
    return this.superAdminService.getAllTenants();
  }

  /**
   * Obtener detalles de un tenant específico
   * GET /super-admin/tenants/:id
   */
  @Get('tenants/:id')
  async getTenantById(@Param('id') id: string) {
    return this.superAdminService.getTenantById(id);
  }

  /**
   * Inactivar un tenant
   * PATCH /super-admin/tenants/:id/deactivate
   */
  @Patch('tenants/:id/deactivate')
  async deactivateTenant(@Param('id') id: string) {
    const tenant = await this.superAdminService.deactivateTenant(id);
    return {
      message: `Tenant "${tenant.name}" inactivado exitosamente`,
      tenant,
    };
  }

  /**
   * Activar un tenant
   * PATCH /super-admin/tenants/:id/activate
   */
  @Patch('tenants/:id/activate')
  async activateTenant(@Param('id') id: string) {
    const tenant = await this.superAdminService.activateTenant(id);
    return {
      message: `Tenant "${tenant.name}" activado exitosamente`,
      tenant,
    };
  }

  /**
   * Blanquear claves de usuarios del tenant
   * POST /super-admin/tenants/:id/reset-passwords
   */
  @Post('tenants/:id/reset-passwords')
  async resetTenantPasswords(@Param('id') id: string) {
    return this.superAdminService.resetTenantPasswords(id);
  }

  /**
   * Eliminar un tenant permanentemente
   * ⚠️ ADVERTENCIA: Esto eliminará todos los datos relacionados
   * DELETE /super-admin/tenants/:id
   */
  @Delete('tenants/:id')
  async deleteTenant(@Param('id') id: string) {
    return this.superAdminService.deleteTenant(id);
  }
}
