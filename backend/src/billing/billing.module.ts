import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingInvoice } from './entities/billing-invoice.entity';
import { BillingInvoiceItem } from './entities/billing-invoice-item.entity';
import { EnhancedBillingService } from './services/enhanced-billing.service';
import { CustomersModule } from '../customers/customers.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { Shipment } from '../shipments/entities/shipment.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { WarehouseLocation } from '../warehouse/entities/warehouse-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillingInvoice,
      BillingInvoiceItem,
      Shipment,
      InventoryItem,
      WarehouseLocation,
    ]),
    CustomersModule,
    ShipmentsModule,
    InventoryModule,
    WarehouseModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, EnhancedBillingService],
  exports: [BillingService, EnhancedBillingService],
})
export class BillingModule {}
