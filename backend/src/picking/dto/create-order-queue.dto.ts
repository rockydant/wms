import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOrderQueueDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shipmentId: string;
}
