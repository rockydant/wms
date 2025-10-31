import { Module } from '@nestjs/common';
import { BarcodesService } from './barcodes.service';

@Module({
  providers: [BarcodesService],
  exports: [BarcodesService],
})
export class BarcodesModule {}
