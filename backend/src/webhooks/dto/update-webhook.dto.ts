import { PartialType } from '@nestjs/swagger';
import { CreateWebhookDto } from './create-webhook.dto';
import { WebhookStatus } from '../entities/webhook.entity';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {
  @ApiProperty({ enum: WebhookStatus, required: false })
  @IsOptional()
  @IsEnum(WebhookStatus)
  status?: WebhookStatus;
}
