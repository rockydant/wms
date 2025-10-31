import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateWarehouseLocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  column: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rack: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bin: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  maxCapacity?: number;
}
