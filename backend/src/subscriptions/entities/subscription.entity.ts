import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SubscriptionPlan, SubscriptionStatus } from '../../tenants/entities/tenant.entity';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'enum', enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ nullable: true })
  stripeSubscriptionId?: string; // External payment provider subscription ID

  @Column({ nullable: true })
  stripeCustomerId?: string; // External payment provider customer ID

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  cancellationReason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  usageAmount: number; // Overage charges for usage beyond plan limits

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
