import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { RealtimeDashboardService } from './services/realtime-dashboard.service';
import { ShipmentsModule } from '../shipments/shipments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PickingModule } from '../picking/picking.module';
import { ReceivingModule } from '../receiving/receiving.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { ReportsModule } from '../reports/reports.module';
import { Shipment } from '../shipments/entities/shipment.entity';
import { PurchaseOrder } from '../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../picking/entities/order-queue.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { WarehouseLocation } from '../warehouse/entities/warehouse-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipment,
      PurchaseOrder,
      OrderQueue,
      InventoryItem,
      WarehouseLocation,
    ]),
    ShipmentsModule,
    InventoryModule,
    PickingModule,
    ReceivingModule,
    WarehouseModule,
    ReportsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, RealtimeDashboardService],
  exports: [DashboardService, RealtimeDashboardService],
})
export class DashboardModule {}
