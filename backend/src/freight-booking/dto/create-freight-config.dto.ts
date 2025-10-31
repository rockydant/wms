import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { CarrierType, PricingModel } from '../entities/freight-config.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFreightConfigDto {
  @ApiProperty({ description: 'Name of the freight configuration (e.g., "UPS Ground")', example: 'UPS Ground' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CarrierType, description: 'Type of carrier', example: CarrierType.UPS })
  @IsEnum(CarrierType)
  carrierType: CarrierType;

  @ApiProperty({ enum: PricingModel, description: 'Pricing model for this configuration', example: PricingModel.WEIGHT_BASED })
  @IsEnum(PricingModel)
  pricingModel: PricingModel;

  @ApiProperty({ description: 'Base rate for the service', example: 5.00, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  baseRate?: number;

  @ApiProperty({ description: 'Rate per unit (weight or volume) if applicable', example: 0.50, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  ratePerUnit?: number;

  @ApiProperty({ description: 'Minimum charge for the service', example: 10.00, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minCharge?: number;

  @ApiProperty({ description: 'Maximum charge for the service', example: 100.00, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxCharge?: number;

  @ApiProperty({ description: 'Estimated transit days', example: 3, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedTransitDays?: number;

  @ApiProperty({ description: 'Does this configuration support weekend delivery?', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  supportsWeekendDelivery?: boolean;

  @ApiProperty({ description: 'Surcharge for weekend delivery if supported', example: 15.00, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  weekendSurcharge?: number;

  @ApiProperty({ description: 'Is this configuration active?', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Description of the freight service', example: 'Standard ground shipping for packages up to 150 lbs', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
