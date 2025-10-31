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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HubsService } from './hubs.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('hubs')
@Controller('hubs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new 3PL hub' })
  create(@Body() createDto: CreateHubDto) {
    return this.hubsService.create(createDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get all 3PL hubs' })
  findAll() {
    return this.hubsService.findAll();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get 3PL hub by ID' })
  findOne(@Param('id') id: string) {
    return this.hubsService.findOne(id);
  }

  @Get('code/:code')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get 3PL hub by code' })
  findByCode(@Param('code') code: string) {
    return this.hubsService.findByCode(code);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update 3PL hub' })
  update(@Param('id') id: string, @Body() updateDto: UpdateHubDto) {
    return this.hubsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete 3PL hub' })
  remove(@Param('id') id: string) {
    return this.hubsService.remove(id);
  }

  @Get(':id/statistics')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get hub statistics' })
  getStatistics(@Param('id') id: string) {
    return this.hubsService.getHubStatistics(id);
  }

  @Post(':id/warehouses/:warehouseId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign warehouse to hub' })
  assignWarehouse(@Param('id') id: string, @Param('warehouseId') warehouseId: string) {
    return this.hubsService.assignWarehouse(id, warehouseId);
  }

  @Post(':id/customers/:customerId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign customer to hub' })
  assignCustomer(@Param('id') id: string, @Param('customerId') customerId: string) {
    return this.hubsService.assignCustomer(id, customerId);
  }
}
