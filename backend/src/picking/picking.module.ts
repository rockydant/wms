import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PickingService } from './picking.service';
import { PickingController } from './picking.controller';
import { OrderQueue } from './entities/order-queue.entity';
import { PickingItem } from './entities/picking-item.entity';
import { PickingRouteOptimizationService } from './services/picking-route-optimization.service';
import { ShipmentsModule } from '../shipments/shipments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BarcodesModule } from '../barcodes/barcodes.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { WarehouseLocation } from '../warehouse/entities/warehouse-location.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderQueue, PickingItem, WarehouseLocation, InventoryItem]),
    BullModule.registerQueue({
      name: 'picking',
    }),
    ShipmentsModule,
    InventoryModule,
    BarcodesModule,
    WarehouseModule,
  ],
  controllers: [PickingController],
  providers: [PickingService, PickingRouteOptimizationService],
  exports: [PickingService, PickingRouteOptimizationService],
})
export class PickingModule {}
