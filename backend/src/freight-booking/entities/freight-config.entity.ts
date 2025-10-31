import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum CarrierType {
  UPS = 'UPS',
  FEDEX = 'FedEx',
  USPS = 'USPS',
  DHL = 'DHL',
  CUSTOM = 'Custom',
}

export enum PricingModel {
  WEIGHT_BASED = 'weight_based',
  VOLUME_BASED = 'volume_based',
  FLAT_RATE = 'flat_rate',
}

@Entity('freight_configs')
@Index(['carrierType', 'isActive'])
export class FreightConfig extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: CarrierType })
  carrierType: CarrierType;

  @Column({ type: 'enum', enum: PricingModel, default: PricingModel.WEIGHT_BASED })
  pricingModel: PricingModel;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  ratePerUnit?: number; // Rate per unit (weight or volume) depending on pricingModel

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minCharge?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxCharge?: number;

  @Column({ type: 'int', nullable: true })
  estimatedTransitDays?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  supportsWeekendDelivery: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weekendSurcharge?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
