import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BillingType } from '../entities/billing-invoice.entity';

export class InvoiceItemDto {
  @ApiProperty({ enum: BillingType })
  @IsEnum(BillingType)
  billingType: BillingType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ enum: BillingType, isArray: true })
  @IsArray()
  @IsEnum(BillingType, { each: true })
  billingTypes: BillingType[];

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  billingPeriodStart?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  billingPeriodEnd?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
