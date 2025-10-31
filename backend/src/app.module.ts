import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReceivingModule } from './receiving/receiving.module';
import { PickingModule } from './picking/picking.module';
import { QcModule } from './qc/qc.module';
import { PackagingModule } from './packaging/packaging.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { ReportsModule } from './reports/reports.module';
import { BarcodesModule } from './barcodes/barcodes.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { FileImportExportModule } from './file-import-export/file-import-export.module';
import { BillingModule } from './billing/billing.module';
import { FreightBookingModule } from './freight-booking/freight-booking.module';
import { TenantsModule } from './tenants/tenants.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HubsModule } from './hubs/hubs.module';
import { MetricsService } from './common/services/metrics.service';
import { MetricsController } from './common/controllers/metrics.controller';

import { getDatabaseConfig } from './database/config';
import { getRedisConfig } from './database/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getRedisConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CustomersModule,
    ShipmentsModule,
    InventoryModule,
    ReceivingModule,
    PickingModule,
    QcModule,
    PackagingModule,
    WarehouseModule,
    ReportsModule,
    BarcodesModule,
    WebhooksModule,
    FileImportExportModule,
    BillingModule,
    FreightBookingModule,
    TenantsModule,
    SubscriptionsModule,
    DashboardModule,
    HubsModule,
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class AppModule {}
