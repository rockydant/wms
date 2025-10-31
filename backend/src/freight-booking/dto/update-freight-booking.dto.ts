import { PartialType } from '@nestjs/swagger';
import { CreateFreightBookingDto } from './create-freight-booking.dto';
import { FreightStatus } from '../entities/freight-booking.entity';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFreightBookingDto extends PartialType(CreateFreightBookingDto) {
  @ApiProperty({ enum: FreightStatus, required: false })
  @IsOptional()
  @IsEnum(FreightStatus)
  status?: FreightStatus;
}
