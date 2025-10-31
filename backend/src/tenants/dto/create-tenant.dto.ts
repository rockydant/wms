import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { SubscriptionPlan } from '../entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subdomain: string; // Must be unique

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: SubscriptionPlan, required: false, default: SubscriptionPlan.FREE })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;
}
