import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ShipmentStatus } from './entities/shipment.entity';

@ApiTags('shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new shipment' })
  create(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentsService.create(createShipmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipments' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    if (customerId) {
      return this.shipmentsService.findByCustomer(customerId, warehouseId);
    }
    return this.shipmentsService.findAll(warehouseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment by ID' })
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER)
  @ApiOperation({ summary: 'Update shipment' })
  update(@Param('id') id: string, @Body() updateShipmentDto: UpdateShipmentDto) {
    return this.shipmentsService.update(id, updateShipmentDto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER, Role.PACKAGING)
  @ApiOperation({ summary: 'Update shipment status' })
  updateStatus(@Param('id') id: string, @Body('status') status: ShipmentStatus) {
    return this.shipmentsService.updateStatus(id, status);
  }

  @Patch(':id/fulfillment')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER, Role.PACKAGING)
  @ApiOperation({ summary: 'Update shipment fulfillment quantity (partial shipment support)' })
  updateFulfillment(
    @Param('id') id: string,
    @Body('fulfilledQuantity') fulfilledQuantity: number,
  ) {
    return this.shipmentsService.updateFulfillment(id, fulfilledQuantity);
  }

  @Patch(':id/fulfillment/add')
  @Roles(Role.SUPER_ADMIN, Role.DELIVERY_LEADER, Role.PACKAGING)
  @ApiOperation({ summary: 'Add fulfilled quantity to shipment' })
  addFulfilledQuantity(
    @Param('id') id: string,
    @Body('additionalQuantity') additionalQuantity: number,
  ) {
    return this.shipmentsService.addFulfilledQuantity(id, additionalQuantity);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete shipment' })
  remove(@Param('id') id: string) {
    return this.shipmentsService.remove(id);
  }
}
