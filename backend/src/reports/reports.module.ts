import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { InsightReportsService } from './services/insight-reports.service';
import { DailyConfirmationService } from './services/daily-confirmation.service';
import { DepartmentPerformanceService } from './services/department-performance.service';
import { ReceivingModule } from '../receiving/receiving.module';
import { PickingModule } from '../picking/picking.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { Shipment } from '../shipments/entities/shipment.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { PurchaseOrder } from '../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../picking/entities/order-queue.entity';
import { PickingItem } from '../picking/entities/picking-item.entity';
import { BillingInvoice } from '../billing/entities/billing-invoice.entity';
import { FreightBooking } from '../freight-booking/entities/freight-booking.entity';
import { WarehouseLocation } from '../warehouse/entities/warehouse-location.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipment,
      InventoryItem,
      PurchaseOrder,
      OrderQueue,
      PickingItem,
      BillingInvoice,
      FreightBooking,
      WarehouseLocation,
      Customer,
    ]),
    ReceivingModule,
    PickingModule,
    ShipmentsModule,
    WebhooksModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    InsightReportsService,
    DailyConfirmationService,
    DepartmentPerformanceService,
  ],
  exports: [
    ReportsService,
    InsightReportsService,
    DailyConfirmationService,
    DepartmentPerformanceService,
  ],
})
export class ReportsModule {}
