import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { CarrierType } from '../entities/freight-booking.entity';

export class CreateFreightBookingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shipmentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty({ enum: CarrierType })
  @IsEnum(CarrierType)
  @IsNotEmpty()
  carrierType: CarrierType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  carrierName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
