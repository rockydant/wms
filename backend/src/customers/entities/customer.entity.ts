import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Hub } from '../../hubs/entities/hub.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ nullable: true })
  tenantId?: string; // Tenant isolation

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @Column()
  name: string;

  @Column({ unique: true })
  contactEmail: string;

  @Column({ unique: true })
  apiKey: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  hubId?: string; // 3PL Hub association

  @ManyToOne(() => Hub, { nullable: true })
  @JoinColumn({ name: 'hubId' })
  hub?: Hub;

  @OneToMany(() => Shipment, (shipment) => shipment.customer)
  shipments: Shipment[];

  @OneToMany(() => InventoryItem, (item) => item.customer)
  inventoryItems: InventoryItem[];
}
