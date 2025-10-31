import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { WarehouseLocation } from '../../warehouse/entities/warehouse-location.entity';

export enum InventoryStatus {
  IN_TRANSIT = 'In Transit',
  RECEIVED = 'Received',
  READY = 'Ready',
  PICKED = 'Picked',
  SHIPPED = 'Shipped',
}

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Column()
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  sku: string;

  @Column()
  size: string;

  @Column()
  color: string;

  @Column({ unique: true })
  inventoryBarcode: string; // Generated barcode

  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.IN_TRANSIT })
  status: InventoryStatus;

  @Column({ nullable: true })
  locationId?: string;

  @ManyToOne(() => WarehouseLocation, { nullable: true })
  @JoinColumn({ name: 'locationId' })
  location?: WarehouseLocation;

  @Column({ nullable: true })
  receivedAt?: Date;

  @Column({ nullable: true })
  pickingBarcode?: string; // Generated when picking starts
}
