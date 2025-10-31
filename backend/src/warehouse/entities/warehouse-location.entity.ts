import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Warehouse } from './warehouse.entity';

@Entity('warehouse_locations')
export class WarehouseLocation extends BaseEntity {
  @Column()
  warehouseId: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.locations)
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column()
  area: string; // Area identifier

  @Column()
  column: string; // Column identifier

  @Column()
  rack: string; // Rack identifier

  @Column()
  bin: string; // Bin identifier

  @Column()
  locationCode: string; // Format: WAREHOUSE-AREA-COLUMN-RACK-BIN (must be unique per warehouse)

  @Column({ type: 'int', default: 0 })
  utilizationCount: number; // For heatmap (auto-updated)

  @Column({ type: 'int', default: 0 })
  maxCapacity: number;

  @Column({ type: 'int', default: 0 })
  currentCapacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  utilizationPercentage: number; // currentCapacity / maxCapacity * 100

  @Column({ type: 'int', default: 0 })
  pickCount: number; // Number of times items were picked from this location (for heatmap)

  @Column({ type: 'int', default: 0 })
  placeCount: number; // Number of times items were placed in this location

  @Column({ nullable: true })
  lastPickedAt?: Date; // Last time an item was picked from this location

  @Column({ nullable: true })
  lastPlacedAt?: Date; // Last time an item was placed in this location

  @OneToMany(() => InventoryItem, (item) => item.location)
  items: InventoryItem[];
}
