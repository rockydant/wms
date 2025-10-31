import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';

export enum FreightStatus {
  PENDING = 'Pending',
  BOOKED = 'Booked',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export enum CarrierType {
  UPS = 'UPS',
  FEDEX = 'FedEx',
  USPS = 'USPS',
  DHL = 'DHL',
  CUSTOM = 'Custom',
}

@Entity('freight_bookings')
export class FreightBooking extends BaseEntity {
  @Column()
  shipmentId: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @Column({ nullable: true })
  warehouseId?: string;

  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'warehouseId' })
  warehouse?: Warehouse;

  @Column({ type: 'enum', enum: FreightStatus, default: FreightStatus.PENDING })
  status: FreightStatus;

  @Column({ type: 'enum', enum: CarrierType })
  carrierType: CarrierType;

  @Column({ nullable: true })
  carrierName?: string; // Custom carrier name if carrierType is CUSTOM

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ nullable: true })
  estimatedDeliveryDate?: Date;

  @Column({ nullable: true })
  bookedAt?: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;

  @Column({ nullable: true })
  pickupAddress?: string;

  @Column({ nullable: true })
  deliveryAddress?: string;

  @Column({ nullable: true })
  weight?: number; // in pounds

  @Column({ nullable: true })
  dimensions?: string; // LxWxH format

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
