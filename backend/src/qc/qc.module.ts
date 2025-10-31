import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QcService } from './qc.service';
import { QcController } from './qc.controller';
import { PickingItem } from '../picking/entities/picking-item.entity';
import { PickingModule } from '../picking/picking.module';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PickingItem]),
    PickingModule,
    ShipmentsModule,
  ],
  controllers: [QcController],
  providers: [QcService],
  exports: [QcService],
})
export class QcModule {}
