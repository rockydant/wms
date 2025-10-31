import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivingService } from './receiving.service';
import { ReceivingController } from './receiving.controller';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem]),
    InventoryModule,
    WarehouseModule,
    CustomersModule,
  ],
  controllers: [ReceivingController],
  providers: [ReceivingService],
  exports: [ReceivingService],
})
export class ReceivingModule {}
