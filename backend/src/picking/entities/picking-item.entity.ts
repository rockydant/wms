import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { OrderQueue } from './order-queue.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('picking_items')
export class PickingItem extends BaseEntity {
  @Column()
  orderQueueId: string;

  @ManyToOne(() => OrderQueue, (queue) => queue.pickingItems)
  @JoinColumn({ name: 'orderQueueId' })
  orderQueue: OrderQueue;

  @Column()
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem: InventoryItem;

  @Column({ nullable: true })
  pickedAt?: Date;

  @Column({ nullable: true })
  pickedBy?: string; // User ID

  @Column({ default: false })
  verified: boolean; // QC verification status
}
