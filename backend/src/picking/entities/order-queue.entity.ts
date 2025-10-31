import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PickingItem } from './picking-item.entity';

export enum Priority {
  FIFO = 'FIFO',
  RUSH = 'Rush',
  REGULAR = 'Regular',
}

export enum OrderType {
  SINGLE = 'Single',
  MULTIPLE = 'Multiple',
}

export enum QueueStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

@Entity('order_queues')
export class OrderQueue extends BaseEntity {
  @Column({ type: 'enum', enum: Priority, default: Priority.FIFO })
  priority: Priority;

  @Column({ type: 'enum', enum: OrderType })
  orderType: OrderType;

  @Column({ type: 'enum', enum: QueueStatus, default: QueueStatus.PENDING })
  status: QueueStatus;

  @Column()
  area: string;

  @Column({ nullable: true })
  warehouseId?: string;

  @Column({ nullable: true })
  shipmentId?: string;

  @Column({ nullable: true })
  assignedTo?: string; // User ID

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @OneToMany(() => PickingItem, (item) => item.orderQueue, { cascade: true })
  pickingItems: PickingItem[];
}
