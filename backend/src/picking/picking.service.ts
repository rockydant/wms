import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderQueue, Priority, OrderType, QueueStatus } from './entities/order-queue.entity';
import { PickingItem } from './entities/picking-item.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateOrderQueueDto } from './dto/create-order-queue.dto';
import { ShipmentsService } from '../shipments/shipments.service';
import { InventoryService } from '../inventory/inventory.service';
import { BarcodesService } from '../barcodes/barcodes.service';
import { HeatmapAutoUpdateService } from '../warehouse/services/heatmap-auto-update.service';
import { InventoryStatus } from '../inventory/entities/inventory-item.entity';

@Injectable()
export class PickingService {
  constructor(
    @InjectRepository(OrderQueue)
    private orderQueueRepository: Repository<OrderQueue>,
    @InjectRepository(PickingItem)
    private pickingItemRepository: Repository<PickingItem>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    private shipmentsService: ShipmentsService,
    private inventoryService: InventoryService,
    private barcodesService: BarcodesService,
    private heatmapAutoUpdateService: HeatmapAutoUpdateService,
  ) {}

  async createFromShipment(shipmentId: string): Promise<OrderQueue> {
    const shipment = await this.shipmentsService.findOne(shipmentId);

    // Determine priority and order type
    const priority = Priority.REGULAR; // Can be enhanced with logic
    const orderType = shipment.items.length === 1 ? OrderType.SINGLE : OrderType.MULTIPLE;

    // Determine area (can be enhanced with logic)
    const area = 'A'; // Default area

    const orderQueue = this.orderQueueRepository.create({
      priority,
      orderType,
      area,
      shipmentId: shipment.id,
      status: QueueStatus.PENDING,
    });

    const savedQueue = await this.orderQueueRepository.save(orderQueue);

    // Create picking items from shipment items
    for (const item of shipment.items) {
      // Find inventory items matching this SKU
      const inventoryItems = await this.inventoryService.findByCustomer(shipment.customerId);
      const matchingItems = inventoryItems.filter(
        (inv) =>
          inv.sku === item.sku &&
          inv.size === item.size &&
          inv.color === item.color &&
          inv.status === InventoryStatus.READY,
      );

      for (let i = 0; i < item.quantity && i < matchingItems.length; i++) {
        const inventoryItem = matchingItems[i];

        // Generate picking barcode
        const pickingBarcode = await this.barcodesService.generatePickingBarcode(
          item.sku,
          savedQueue.id,
        );

        // Update inventory item with picking barcode directly
        // We need to save directly since pickingBarcode is not in the DTO
        inventoryItem.pickingBarcode = pickingBarcode;
        await this.inventoryItemRepository.save(inventoryItem);

        // Create picking item
        const pickingItem = this.pickingItemRepository.create({
          orderQueueId: savedQueue.id,
          inventoryItemId: inventoryItem.id,
          verified: false,
        });

        await this.pickingItemRepository.save(pickingItem);
      }
    }

    return this.findOne(savedQueue.id);
  }

  async findAll(): Promise<OrderQueue[]> {
    return this.orderQueueRepository.find({
      relations: ['pickingItems', 'pickingItems.inventoryItem'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<OrderQueue> {
    const queue = await this.orderQueueRepository.findOne({
      where: { id },
      relations: ['pickingItems', 'pickingItems.inventoryItem'],
    });
    if (!queue) {
      throw new NotFoundException(`Order Queue with ID ${id} not found`);
    }
    return queue;
  }

  async assignQueue(queueId: string, userId: string): Promise<OrderQueue> {
    const queue = await this.findOne(queueId);
    queue.assignedTo = userId;
    queue.status = QueueStatus.IN_PROGRESS;
    queue.startedAt = new Date();
    return this.orderQueueRepository.save(queue);
  }

  async completePicking(queueId: string, userId: string): Promise<OrderQueue> {
    const queue = await this.findOne(queueId);

    // Mark all items as picked
    for (const pickingItem of queue.pickingItems) {
      pickingItem.pickedAt = new Date();
      pickingItem.pickedBy = userId;
      await this.pickingItemRepository.save(pickingItem);

      // Update inventory status
      if (pickingItem.inventoryItem) {
        await this.inventoryService.updateStatus(
          pickingItem.inventoryItem.id,
          InventoryStatus.PICKED,
        );

        // Auto-update heatmap on pick
        if (pickingItem.inventoryItem.locationId) {
          await this.heatmapAutoUpdateService.updateOnPick(
            pickingItem.inventoryItem.locationId,
          );
        }
      }
    }

    queue.status = QueueStatus.COMPLETED;
    queue.completedAt = new Date();
    return this.orderQueueRepository.save(queue);
  }

  async verifyPick(queueId: string, itemId: string, barcode: string): Promise<boolean> {
    const queue = await this.findOne(queueId);
    const pickingItem = queue.pickingItems.find((item) => item.id === itemId);

    if (!pickingItem || !pickingItem.inventoryItem) {
      return false;
    }

    // Verify barcode matches
    const matches =
      pickingItem.inventoryItem.inventoryBarcode === barcode ||
      pickingItem.inventoryItem.pickingBarcode === barcode;

    if (matches) {
      pickingItem.verified = true;
      await this.pickingItemRepository.save(pickingItem);
    }

    return matches;
  }
}
