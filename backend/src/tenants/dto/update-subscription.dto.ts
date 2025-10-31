import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SubscriptionPlan, SubscriptionStatus } from '../entities/tenant.entity';

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsNotEmpty()
  status: SubscriptionStatus;
}
