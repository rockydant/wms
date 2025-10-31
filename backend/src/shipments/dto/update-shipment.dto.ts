import { PartialType } from '@nestjs/swagger';
import { CreateShipmentDto } from './create-shipment.dto';
import { ShipmentStatus } from '../entities/shipment.entity';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShipmentDto extends PartialType(CreateShipmentDto) {
  @ApiProperty({ enum: ShipmentStatus, required: false })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingLabel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  packingSlip?: string;
}
