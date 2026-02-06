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
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('professionals')
export class ProfessionalsController {
  constructor(
    private readonly professionalsService: ProfessionalsService,
    private readonly prisma: PrismaService,
  ) {}

  // Público: Obtener profesionales activos por tenant slug
  @Get('tenant/:tenantSlug')
  async findByTenantSlug(@Param('tenantSlug') tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    
    return this.professionalsService.findActive(tenant.id);
  }

  // Admin: Crear profesional
  @Post()
  @UseGuards(TenantGuard)
  create(
    @TenantId() tenantId: string,
    @Body() createProfessionalDto: CreateProfessionalDto,
  ) {
    return this.professionalsService.create(tenantId, createProfessionalDto);
  }

  // Admin: Listar profesionales
  @Get()
  @UseGuards(TenantGuard)
  findAll(@TenantId() tenantId: string) {
    return this.professionalsService.findAll(tenantId);
  }

  // Admin: Obtener profesional por ID
  @Get(':id')
  @UseGuards(TenantGuard)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.professionalsService.findOne(id, tenantId);
  }

  // Admin: Actualizar profesional
  @Patch(':id')
  @UseGuards(TenantGuard)
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(id, tenantId, updateProfessionalDto);
  }

  // Admin: Eliminar profesional
  @Delete(':id')
  @UseGuards(TenantGuard)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.professionalsService.remove(id, tenantId);
  }
}

