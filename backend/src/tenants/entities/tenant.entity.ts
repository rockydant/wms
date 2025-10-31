import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionPlan {
  FREE = 'Free',
  STARTER = 'Starter',
  PROFESSIONAL = 'Professional',
  ENTERPRISE = 'Enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'Active',
  TRIAL = 'Trial',
  SUSPENDED = 'Suspended',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ unique: true })
  name: string; // Organization/Company name

  @Column({ unique: true })
  subdomain: string; // Unique subdomain for tenant

  @Column({ unique: true })
  domain?: string; // Custom domain (optional)

  @Column()
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  subscriptionPlan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true })
  subscriptionStartDate?: Date;

  @Column({ nullable: true })
  subscriptionEndDate?: Date;

  @Column({ nullable: true })
  trialEndDate?: Date;

  @Column({ type: 'int', default: 0 })
  maxUsers: number; // Maximum number of users allowed

  @Column({ type: 'int', default: 1 })
  maxWarehouses: number; // Maximum number of warehouses allowed

  @Column({ type: 'int', default: 1000 })
  maxStorageItems: number; // Maximum storage items per month

  @Column({ type: 'int', default: 100 })
  maxShipmentsPerMonth: number; // Maximum shipments per month

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  settings?: string; // JSON string for tenant-specific settings

  @OneToMany(() => Customer, (customer) => customer.tenant)
  customers: Customer[];

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
