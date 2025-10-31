import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem extends BaseEntity {
  @Column()
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @Column()
  sku: string;

  @Column()
  size: string;

  @Column()
  color: string;

  @Column({ type: 'int' })
  expectedQuantity: number;

  @Column({ type: 'int', default: 0 })
  receivedQuantity: number;

  @Column({ nullable: true })
  inventoryItemId?: string;

  @ManyToOne(() => InventoryItem, { nullable: true })
  @JoinColumn({ name: 'inventoryItemId' })
  inventoryItem?: InventoryItem;
}
