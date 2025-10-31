import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from './entities/inventory-item.entity';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { CustomersModule } from '../customers/customers.module';
import { BarcodesModule } from '../barcodes/barcodes.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { PickingModule } from '../picking/picking.module';
import { Shipment } from '../shipments/entities/shipment.entity';
import { PickingItem } from '../picking/entities/picking-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryItem, Shipment, PickingItem]),
    CustomersModule,
    BarcodesModule,
    forwardRef(() => WarehouseModule),
    forwardRef(() => ShipmentsModule),
    forwardRef(() => PickingModule),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, AnomalyDetectionService],
  exports: [InventoryService, AnomalyDetectionService],
})
export class InventoryModule {}
