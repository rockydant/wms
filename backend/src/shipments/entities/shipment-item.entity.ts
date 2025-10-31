import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shipment } from './shipment.entity';

@Entity('shipment_items')
export class ShipmentItem extends BaseEntity {
  @Column()
  shipmentId: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.items)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @Column()
  sku: string;

  @Column()
  size: string;

  @Column()
  color: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;
}
