import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantGuard } from '../common/guards/tenant.guard';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {
    console.log('✅ TenantsController initialized - POST /tenants endpoint registered');
  }

  // Admin: Crear tenant (durante onboarding) - DEBE IR ANTES de las rutas GET para evitar conflictos
  @Post()
  async create(@Body() createTenantDto: CreateTenantDto) {
    console.log('📥 POST /tenants - Request received at controller');
    console.log('📥 POST /tenants - Body:', JSON.stringify(createTenantDto, null, 2));
    try {
      const tenant = await this.tenantsService.create(createTenantDto);
      console.log('✅ Tenant created successfully:', tenant.id);
      return tenant;
    } catch (error) {
      console.error('❌ Error in tenant controller:', error);
      throw error;
    }
  }

  // Público: Rango horario del edificio (para grilla de reservas)
  @Get('slug/:slug/schedule-range')
  getScheduleRange(@Param('slug') slug: string) {
    return this.tenantsService.getScheduleRangeBySlug(slug);
  }

  // Público: Obtener tenant por slug (para landing pública)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  // Admin: Listar todos (con autenticación en el futuro)
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  // Admin: Obtener tenant por ID (público para poder cargar el tenant inicial)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  // Admin: Actualizar tenant
  @Patch(':id')
  @UseGuards(TenantGuard)
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  // Admin: Eliminar tenant
  @Delete(':id')
  @UseGuards(TenantGuard)
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}

