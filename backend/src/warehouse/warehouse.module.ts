import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { Warehouse } from './entities/warehouse.entity';
import { PredictiveHeatmapService } from './services/predictive-heatmap.service';
import { AutoRackPlacementService } from './services/auto-rack-placement.service';
import { AIHeatmapUpdateService } from './services/ai-heatmap-update.service';
import { InventoryModule } from '../inventory/inventory.module';
import { PickingModule } from '../picking/picking.module';
import { WarehouseCrudService } from './services/warehouse-crud.service';
import { HeatmapAutoUpdateService } from './services/heatmap-auto-update.service';
import { RackOptimizationService } from './services/rack-optimization.service';
import { BinUtilizationAnalyticsService } from './services/bin-utilization-analytics.service';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { PickingItem } from '../picking/entities/picking-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarehouseLocation,
      Warehouse,
      InventoryItem,
      PickingItem,
    ]),
    forwardRef(() => InventoryModule),
    forwardRef(() => PickingModule),
  ],
  controllers: [WarehouseController],
  providers: [
    WarehouseService,
    WarehouseCrudService,
    HeatmapAutoUpdateService,
    RackOptimizationService,
    BinUtilizationAnalyticsService,
    PredictiveHeatmapService,
    AutoRackPlacementService,
    AIHeatmapUpdateService,
  ],
  exports: [
    WarehouseService,
    WarehouseCrudService,
    HeatmapAutoUpdateService,
    RackOptimizationService,
    BinUtilizationAnalyticsService,
    PredictiveHeatmapService,
    AutoRackPlacementService,
    AIHeatmapUpdateService,
  ],
})
export class WarehouseModule {}
