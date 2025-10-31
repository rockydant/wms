import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsEnum, IsDateString } from 'class-validator';
import { BillingType } from '../entities/billing-invoice.entity';

export class GenerateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ enum: BillingType, isArray: true })
  @IsArray()
  @IsEnum(BillingType, { each: true })
  billingTypes: BillingType[];
}
