import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileImportExportService } from './file-import-export.service';
import { FileImportExportController } from './file-import-export.controller';
import { CustomersModule } from '../customers/customers.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    CustomersModule,
    ShipmentsModule,
    InventoryModule,
  ],
  controllers: [FileImportExportController],
  providers: [FileImportExportService],
  exports: [FileImportExportService],
})
export class FileImportExportModule {}
