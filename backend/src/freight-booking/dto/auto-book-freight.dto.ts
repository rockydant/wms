import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { CarrierType } from '../entities/freight-booking.entity';

export class AutoBookFreightDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shipmentId: string;

  @ApiProperty({ enum: CarrierType })
  @IsEnum(CarrierType)
  @IsNotEmpty()
  carrierType: CarrierType;
}
