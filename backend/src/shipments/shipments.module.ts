import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { Shipment } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, ShipmentItem]),
    CustomersModule,
    forwardRef(() => InventoryModule),
    WebhooksModule,
    forwardRef(() => WarehouseModule),
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
