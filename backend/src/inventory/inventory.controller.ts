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
import { InventoryService } from './inventory.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InventoryStatus } from './entities/inventory-item.entity';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
  ) {}

  @Post()
  @Roles(Role.RECEIVING, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new inventory item' })
  create(@Body() createInventoryItemDto: CreateInventoryItemDto) {
    return this.inventoryService.create(createInventoryItemDto);
  }

  @Post('bulk')
  @Roles(Role.RECEIVING, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create multiple inventory items at once' })
  createBulk(
    @Body('item') createInventoryItemDto: CreateInventoryItemDto,
    @Body('quantity') quantity: number,
  ) {
    if (!quantity || quantity < 1) {
      quantity = 1;
    }
    if (quantity > 1000) {
      quantity = 1000; // Limit to prevent abuse
    }
    return this.inventoryService.createBulk(createInventoryItemDto, quantity);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  findAll(@Query('customerId') customerId?: string) {
    if (customerId) {
      return this.inventoryService.findByCustomer(customerId);
    }
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Get inventory item by barcode' })
  findByBarcode(@Param('barcode') barcode: string) {
    return this.inventoryService.findByBarcode(barcode);
  }

  @Patch(':id')
  @Roles(Role.RECEIVING, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update inventory item' })
  update(
    @Param('id') id: string,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, updateInventoryItemDto);
  }

  @Patch(':id/status')
  @Roles(Role.RECEIVING, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update inventory item status' })
  updateStatus(@Param('id') id: string, @Body('status') status: InventoryStatus) {
    return this.inventoryService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete inventory item' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Get('anomalies')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Detect inventory anomalies' })
  detectAnomalies(
    @Query('customerId') customerId?: string,
    @Query('days') days?: string,
  ) {
    return this.anomalyDetectionService.detectAnomalies(
      customerId,
      days ? parseInt(days) : 7,
    );
  }

  @Get('anomalies/summary')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get anomaly detection summary' })
  getAnomalySummary(@Query('customerId') customerId?: string) {
    return this.anomalyDetectionService.getAnomalySummary(customerId);
  }

  @Get('summary/by-sku')
  @ApiOperation({ summary: 'Get inventory summary grouped by SKU with quantities' })
  getSummaryBySku(@Query('customerId') customerId?: string) {
    return this.inventoryService.getSummaryBySku(customerId);
  }
}
