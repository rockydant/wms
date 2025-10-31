import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { WebhookEvent } from '../entities/webhook.entity';

export class CreateWebhookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ enum: WebhookEvent, isArray: true })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  secret?: string; // If not provided, will be auto-generated
}
