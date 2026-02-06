import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly prisma: PrismaService,
  ) {}

  // Público: Obtener servicios activos por tenant slug
  @Get('tenant/:tenantSlug')
  async findByTenantSlug(@Param('tenantSlug') tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    return this.servicesService.findActive(tenant.id);
  }

  // Admin: Crear servicio
  @Post()
  @UseGuards(TenantGuard)
  create(@TenantId() tenantId: string, @Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(tenantId, createServiceDto);
  }

  // Admin: Listar servicios
  @Get()
  @UseGuards(TenantGuard)
  findAll(@TenantId() tenantId: string) {
    return this.servicesService.findAll(tenantId);
  }

  // Admin: Obtener servicio por ID
  @Get(':id')
  @UseGuards(TenantGuard)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.servicesService.findOne(id, tenantId);
  }

  // Admin: Actualizar servicio
  @Patch(':id')
  @UseGuards(TenantGuard)
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, tenantId, updateServiceDto);
  }

  // Admin: Eliminar servicio
  @Delete(':id')
  @UseGuards(TenantGuard)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.servicesService.remove(id, tenantId);
  }
}

