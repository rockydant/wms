import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum WebhookEvent {
  SHIPMENT_CREATED = 'shipment.created',
  SHIPMENT_UPDATED = 'shipment.updated',
  SHIPMENT_SHIPPED = 'shipment.shipped',
  SHIPMENT_PARTIALLY_SHIPPED = 'shipment.partially_shipped',
  SHIPMENT_READY = 'shipment.ready',
  INVENTORY_UPDATED = 'inventory.updated',
  ORDER_QUEUE_COMPLETED = 'order_queue.completed',
}

export enum WebhookStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  FAILED = 'Failed',
}

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @Column()
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  url: string; // Webhook URL endpoint

  @Column({ type: 'enum', enum: WebhookEvent, array: true })
  events: WebhookEvent[]; // Events to subscribe to

  @Column({ type: 'enum', enum: WebhookStatus, default: WebhookStatus.ACTIVE })
  status: WebhookStatus;

  @Column({ nullable: true })
  secret?: string; // Secret for webhook signature verification

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastTriggeredAt?: Date;

  @Column({ nullable: true })
  lastFailedAt?: Date;

  @Column({ nullable: true })
  lastErrorMessage?: string;
}
