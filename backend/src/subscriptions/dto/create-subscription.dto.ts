import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { SubscriptionPlan } from '../../tenants/entities/tenant.entity';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripeCustomerId?: string;
}
