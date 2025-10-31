import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { ShipmentItem } from './shipment-item.entity';

export enum ShipmentStatus {
  PENDING = 'Pending',
  RECEIVING = 'Receiving',
  READY = 'Ready',
  PARTIALLY_SHIPPED = 'Partially Shipped',
  SHIPPED = 'Shipped',
}

@Entity('shipments')
export class Shipment extends BaseEntity {
  @Column()
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ nullable: true })
  warehouseId?: string;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'warehouseId' })
  warehouse?: Warehouse;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  shippingLabel?: string;

  @Column({ nullable: true })
  packingSlip?: string;

  @Column({ nullable: true })
  shippedAt?: Date;

  @Column({ type: 'int', default: 0 })
  totalQuantity: number; // Total quantity of items in shipment

  @Column({ type: 'int', default: 0 })
  fulfilledQuantity: number; // Quantity that has been fulfilled/shipped

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  fulfillmentPercentage: number; // fulfilledQuantity / totalQuantity * 100

  @OneToMany(() => ShipmentItem, (item) => item.shipment, { cascade: true })
  items: ShipmentItem[];
}
