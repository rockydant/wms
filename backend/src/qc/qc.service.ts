import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickingItem } from '../picking/entities/picking-item.entity';
import { PickingService } from '../picking/picking.service';
import { ShipmentsService } from '../shipments/shipments.service';
import { ShipmentStatus } from '../shipments/entities/shipment.entity';

@Injectable()
export class QcService {
  constructor(
    @InjectRepository(PickingItem)
    private pickingItemRepository: Repository<PickingItem>,
    private pickingService: PickingService,
    private shipmentsService: ShipmentsService,
  ) {}

  async verifyItem(queueId: string, itemId: string, inventoryBarcode: string, pickingBarcode: string): Promise<boolean> {
    const queue = await this.pickingService.findOne(queueId);
    const pickingItem = queue.pickingItems.find((item) => item.id === itemId);

    if (!pickingItem || !pickingItem.inventoryItem) {
      throw new NotFoundException('Picking item not found');
    }

    // Verify both barcodes match
    const inventoryMatches = pickingItem.inventoryItem.inventoryBarcode === inventoryBarcode;
    const pickingMatches = pickingItem.inventoryItem.pickingBarcode === pickingBarcode;

    if (inventoryMatches && pickingMatches) {
      pickingItem.verified = true;
      await this.pickingItemRepository.save(pickingItem);
      return true;
    }

    return false;
  }

  async completeQC(queueId: string, shipmentId: string): Promise<void> {
    const queue = await this.pickingService.findOne(queueId);
    const allVerified = queue.pickingItems.every((item) => item.verified);

    if (!allVerified) {
      throw new Error('Not all items are verified');
    }

    // Generate shipping label and packing slip (placeholder)
    const shippingLabel = `SHIP-${shipmentId}-${Date.now()}`;
    const packingSlip = `PS-${shipmentId}-${Date.now()}`;

    // Update shipment
    await this.shipmentsService.update(shipmentId, {
      shippingLabel,
      packingSlip,
    });

    // Update shipment status to Ready
    await this.shipmentsService.updateStatus(shipmentId, ShipmentStatus.READY);
  }
}
