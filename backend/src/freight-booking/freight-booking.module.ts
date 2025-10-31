import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreightBookingService } from './freight-booking.service';
import { FreightBookingController } from './freight-booking.controller';
import { FreightBooking } from './entities/freight-booking.entity';
import { WeekendSchedulingService } from './services/weekend-scheduling.service';
import { FreightManagementService } from './services/freight-management.service';
import { ShipmentsModule } from '../shipments/shipments.module';
import { HttpModule } from '@nestjs/axios';
import { Shipment } from '../shipments/entities/shipment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FreightBooking, Shipment]),
    ShipmentsModule,
    HttpModule,
  ],
  controllers: [FreightBookingController],
  providers: [FreightBookingService, WeekendSchedulingService, FreightManagementService],
  exports: [FreightBookingService, WeekendSchedulingService, FreightManagementService],
})
export class FreightBookingModule {}
