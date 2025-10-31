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
import { WarehouseService } from './warehouse.service';
import { PredictiveHeatmapService } from './services/predictive-heatmap.service';
import { AutoRackPlacementService } from './services/auto-rack-placement.service';
import { AIHeatmapUpdateService } from './services/ai-heatmap-update.service';
import { CreateWarehouseLocationDto } from './dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse-location.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { RackOptimizationService } from './services/rack-optimization.service';
import { BinUtilizationAnalyticsService } from './services/bin-utilization-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('warehouse')
@Controller('warehouse')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly rackOptimizationService: RackOptimizationService,
    private readonly binUtilizationAnalyticsService: BinUtilizationAnalyticsService,
    private readonly predictiveHeatmapService: PredictiveHeatmapService,
    private readonly autoRackPlacementService: AutoRackPlacementService,
    private readonly aiHeatmapUpdateService: AIHeatmapUpdateService,
  ) {}

  // Warehouse CRUD
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Create a new warehouse' })
  createWarehouse(@Body() createDto: CreateWarehouseDto) {
    return this.warehouseService.createWarehouse(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  findAllWarehouses(@Query('warehouseId') warehouseId?: string) {
    if (warehouseId) {
      return this.warehouseService.findOneWarehouse(warehouseId);
    }
    return this.warehouseService.findAllWarehouses();
  }

  @Get('info/:id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  findOneWarehouse(@Param('id') id: string) {
    return this.warehouseService.findOneWarehouse(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Update warehouse' })
  updateWarehouse(@Param('id') id: string, @Body() updateDto: UpdateWarehouseDto) {
    return this.warehouseService.updateWarehouse(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete warehouse' })
  removeWarehouse(@Param('id') id: string) {
    return this.warehouseService.removeWarehouse(id);
  }

  // Location CRUD
  @Post('locations')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Create a new warehouse location' })
  createLocation(@Body() createDto: CreateWarehouseLocationDto) {
    return this.warehouseService.createLocation(createDto);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all warehouse locations' })
  findAllLocations(@Query('warehouseId') warehouseId?: string) {
    return this.warehouseService.findAllLocations(warehouseId);
  }

  @Get('locations/info/:id')
  @ApiOperation({ summary: 'Get warehouse location by ID' })
  findOneLocation(@Param('id') id: string) {
    return this.warehouseService.findOne(id);
  }

  @Patch('locations/:id')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Update warehouse location' })
  updateLocation(@Param('id') id: string, @Body() updateDto: UpdateWarehouseLocationDto) {
    return this.warehouseService.update(id, updateDto);
  }

  @Patch('locations/:id/utilization')
  @Roles(Role.RECEIVING, Role.PICKING)
  @ApiOperation({ summary: 'Update location utilization count' })
  updateUtilization(@Param('id') id: string) {
    return this.warehouseService.updateUtilization(id);
  }

  @Delete('locations/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete warehouse location' })
  removeLocation(@Param('id') id: string) {
    return this.warehouseService.remove(id);
  }

  // Heatmap
  @Get('heatmap')
  @ApiOperation({ summary: 'Get warehouse heatmap data (auto-updated)' })
  getHeatmap(@Query('warehouseId') warehouseId?: string) {
    return this.warehouseService.getHeatmap(warehouseId);
  }

  @Patch('heatmap/:warehouseId/refresh')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Refresh warehouse heatmap data' })
  refreshHeatmap(@Param('warehouseId') warehouseId: string) {
    return this.warehouseService.updateWarehouseHeatmap(warehouseId);
  }

  // Analytics
  @Get('analytics/utilization/:warehouseId')
  @ApiOperation({ summary: 'Get bin utilization analytics for a warehouse' })
  getUtilizationMetrics(@Param('warehouseId') warehouseId: string) {
    return this.binUtilizationAnalyticsService.getWarehouseUtilizationMetrics(warehouseId);
  }

  @Get('analytics/utilization')
  @ApiOperation({ summary: 'Get bin utilization analytics for all warehouses' })
  getAllUtilizationMetrics() {
    return this.binUtilizationAnalyticsService.getAllWarehousesUtilizationMetrics();
  }

  @Get('analytics/utilization/trends/:warehouseId')
  @ApiOperation({ summary: 'Get utilization trends over time' })
  getUtilizationTrends(@Param('warehouseId') warehouseId: string) {
    return this.binUtilizationAnalyticsService.getUtilizationTrends(warehouseId);
  }

  @Get('analytics/utilization/area/:warehouseId')
  @ApiOperation({ summary: 'Get utilization by area' })
  getUtilizationByArea(@Param('warehouseId') warehouseId: string) {
    return this.binUtilizationAnalyticsService.getUtilizationByArea(warehouseId);
  }

  @Get('analytics/utilization/underutilized/:warehouseId')
  @ApiOperation({ summary: 'Get top underutilized locations' })
  getUnderutilizedLocations(
    @Param('warehouseId') warehouseId: string,
    @Query('limit') limit?: string,
  ) {
    return this.binUtilizationAnalyticsService.getTopUnderutilizedLocations(
      warehouseId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('analytics/utilization/overutilized/:warehouseId')
  @ApiOperation({ summary: 'Get top overutilized locations' })
  getOverutilizedLocations(
    @Param('warehouseId') warehouseId: string,
    @Query('limit') limit?: string,
  ) {
    return this.binUtilizationAnalyticsService.getTopOverutilizedLocations(
      warehouseId,
      limit ? parseInt(limit) : 10,
    );
  }

  // Optimization
  @Get('optimization/recommendations/:warehouseId')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get rack layout optimization recommendations' })
  getOptimizationRecommendations(@Param('warehouseId') warehouseId: string) {
    return this.rackOptimizationService.getOptimizationRecommendations(warehouseId);
  }

  @Get('optimization/placement/:warehouseId')
  @Roles(Role.RECEIVING, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Find optimal rack placement for a SKU' })
  findOptimalPlacement(
    @Param('warehouseId') warehouseId: string,
    @Query('sku') sku: string,
  ) {
    return this.rackOptimizationService.findOptimalPlacement(warehouseId, sku);
  }

  @Get('predictive-heatmap/:warehouseId')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get predictive heatmap for warehouse' })
  getPredictiveHeatmap(
    @Param('warehouseId') warehouseId: string,
    @Query('daysAhead') daysAhead?: string,
  ) {
    return this.predictiveHeatmapService.generatePredictiveHeatmap(
      warehouseId,
      daysAhead ? parseInt(daysAhead) : 7,
    );
  }

  @Get('predictive-heatmap/:warehouseId/recommendations')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get optimization recommendations from predictive heatmap' })
  getOptimizationRecommendations(@Param('warehouseId') warehouseId: string) {
    return this.predictiveHeatmapService.getOptimizationRecommendations(warehouseId);
  }

  @Get('auto-placement/:warehouseId')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER, Role.RECEIVING)
  @ApiOperation({ summary: 'Get optimal placement recommendations for SKU' })
  getOptimalPlacement(
    @Param('warehouseId') warehouseId: string,
    @Query('sku') sku: string,
    @Query('size') size?: string,
    @Query('color') color?: string,
  ) {
    return this.autoRackPlacementService.getOptimalPlacement(warehouseId, sku, size, color);
  }

  @Post('auto-placement/:warehouseId/place')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER, Role.RECEIVING)
  @ApiOperation({ summary: 'Automatically place SKU in optimal location' })
  autoPlaceSKU(
    @Param('warehouseId') warehouseId: string,
    @Body('inventoryItemId') inventoryItemId: string,
    @Body('sku') sku: string,
    @Body('size') size?: string,
    @Body('color') color?: string,
  ) {
    return this.autoRackPlacementService.autoPlaceSKU(warehouseId, inventoryItemId, sku, size, color);
  }

  @Post('heatmap/:warehouseId/ai-update')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Auto-update heatmap using AI predictions' })
  autoUpdateHeatmapWithAI(@Param('warehouseId') warehouseId: string) {
    return this.aiHeatmapUpdateService.autoUpdateHeatmapWithAI(warehouseId);
  }

  @Get('heatmap/:warehouseId/ai-recommendations')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Get AI recommendations for warehouse optimization' })
  getAIRecommendations(@Param('warehouseId') warehouseId: string) {
    return this.aiHeatmapUpdateService.getAIRecommendations(warehouseId);
  }

  @Post('heatmap/:warehouseId/schedule-ai-update')
  @Roles(Role.SUPER_ADMIN, Role.INVENTORY_LEADER)
  @ApiOperation({ summary: 'Schedule automatic AI updates for warehouse' })
  scheduleAutoUpdate(
    @Param('warehouseId') warehouseId: string,
    @Body('intervalHours') intervalHours?: number,
  ) {
    return this.aiHeatmapUpdateService.scheduleAutoUpdate(warehouseId, intervalHours || 24);
  }
}
