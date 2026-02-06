import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Admin: Listar clientes
  @Get()
  @UseGuards(TenantGuard)
  findAll(@TenantId() tenantId: string) {
    return this.customersService.findAll(tenantId);
  }

  // Admin: Obtener cliente por ID
  @Get(':id')
  @UseGuards(TenantGuard)
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.customersService.findOne(id, tenantId);
  }

  // Interno: Crear o encontrar cliente (usado al crear appointment)
  @Post()
  async createOrFind(
    @Query('tenantId') tenantId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.createOrFind(tenantId, createCustomerDto);
  }
}

