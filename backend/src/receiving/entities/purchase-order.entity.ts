import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum POStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Column()
  customerId: string;

  @Column({ nullable: true })
  warehouseId?: string;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'warehouseId' })
  warehouse?: Warehouse;

  @Column()
  poNumber: string; // Purchase Order Number

  @Column({ type: 'enum', enum: POStatus, default: POStatus.PENDING })
  status: POStatus;

  @Column({ nullable: true })
  receivedBy?: string; // User ID

  @Column({ nullable: true })
  receivedAt?: Date;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];
}
