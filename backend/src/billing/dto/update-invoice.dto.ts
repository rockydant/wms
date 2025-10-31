import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';
import { InvoiceStatus } from '../entities/billing-invoice.entity';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiProperty({ enum: InvoiceStatus, required: false })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
