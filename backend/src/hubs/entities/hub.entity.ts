import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Customer } from '../../customers/entities/customer.entity';

/**
 * 3PL Hub Entity
 * Represents a fulfillment hub (3PL provider) that manages multiple warehouses and customers
 */
@Entity('hubs')
export class Hub extends BaseEntity {
  @Column({ nullable: true })
  tenantId?: string; // Tenant isolation

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column()
  name: string; // Hub name (e.g., "West Coast Fulfillment Hub")

  @Column({ unique: true })
  code: string; // Unique hub code (e.g., "WCFH")

  @Column()
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Warehouse, (warehouse) => warehouse.hub)
  warehouses: Warehouse[];

  @OneToMany(() => Customer, (customer) => customer.hub)
  customers: Customer[];
}
