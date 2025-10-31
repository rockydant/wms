import { Module } from '@nestjs/common';
import { ShipmentsModule } from '../shipments/shipments.module';
import { FreightBookingModule } from '../freight-booking/freight-booking.module';
import { PackagingService } from './packaging.service';
import { PackagingController } from './packaging.controller';

@Module({
  imports: [ShipmentsModule, FreightBookingModule],
  controllers: [PackagingController],
  providers: [PackagingService],
  exports: [PackagingService],
})
export class PackagingModule {}
