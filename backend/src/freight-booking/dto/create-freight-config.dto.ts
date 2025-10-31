import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateFreightConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  carrierType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  carrierName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  ratePerWeight: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  ratePerVolume: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minCharge: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCharge?: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  transitDays: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  supportsWeekendDelivery?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weekendSurcharge?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  insuranceIncluded?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  trackingIncluded?: boolean;
}
