import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { WarehouseLocation } from './warehouse-location.entity';
import { Hub } from '../../hubs/entities/hub.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { PurchaseOrder } from '../../receiving/entities/purchase-order.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column()
  name: string;

  @Column()
  code: string; // Unique warehouse code (e.g., WH-001)

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  zipCode?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  totalLocations: number; // Total BRAC locations

  @Column({ type: 'int', default: 0 })
  utilizedLocations: number; // Currently used locations

  @Column({ nullable: true })
  hubId?: string; // 3PL Hub association

  @ManyToOne(() => Hub, { nullable: true })
  @JoinColumn({ name: 'hubId' })
  hub?: Hub;

  @OneToMany(() => WarehouseLocation, (location) => location.warehouse)
  locations: WarehouseLocation[];

  @OneToMany(() => Shipment, (shipment) => shipment.warehouse)
  shipments: Shipment[];

  @OneToMany(() => PurchaseOrder, (po) => po.warehouse)
  purchaseOrders: PurchaseOrder[];
}
