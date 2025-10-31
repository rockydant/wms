import { Injectable, NotFoundException } from '@nestjs/common';
import { ShipmentsService } from '../shipments/shipments.service';
import { FreightBookingService } from '../freight-booking/freight-booking.service';
import { ShipmentStatus } from '../shipments/entities/shipment.entity';
import { CarrierType } from '../freight-booking/entities/freight-booking.entity';

@Injectable()
export class PackagingService {
  constructor(
    private shipmentsService: ShipmentsService,
    private freightBookingService: FreightBookingService,
  ) {}

  async packageShipment(shipmentId: string, autoBookFreight: boolean = false, carrierType?: CarrierType): Promise<void> {
    const shipment = await this.shipmentsService.findOne(shipmentId);

    if (shipment.status !== ShipmentStatus.READY) {
      throw new Error('Shipment is not ready for packaging');
    }

    // Update status to Shipped
    await this.shipmentsService.updateStatus(shipmentId, ShipmentStatus.SHIPPED);

    // Automatically book freight if requested
    if (autoBookFreight && carrierType) {
      await this.freightBookingService.autoBookFreight(shipmentId, carrierType);
    }
  }

  async getShipmentsReadyForPackaging() {
    const allShipments = await this.shipmentsService.findAll();
    return allShipments.filter((s) => s.status === ShipmentStatus.READY);
  }
}
