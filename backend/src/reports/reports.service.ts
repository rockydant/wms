import { Injectable } from '@nestjs/common';
import { ReceivingService } from '../receiving/receiving.service';
import { PickingService } from '../picking/picking.service';
import { ShipmentsService } from '../shipments/shipments.service';

@Injectable()
export class ReportsService {
  constructor(
    private receivingService: ReceivingService,
    private pickingService: PickingService,
    private shipmentsService: ShipmentsService,
  ) {}

  async getDailyReceivingReport(date?: Date) {
    const targetDate = date || new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const pos = await this.receivingService.findAll();
    const filteredPOs = pos.filter((po) => {
      const poDate = new Date(po.receivedAt || po.createdAt);
      return poDate >= startDate && poDate <= endDate;
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalPOs: filteredPOs.length,
      completedPOs: filteredPOs.filter((po) => po.status === 'Completed').length,
      pendingPOs: filteredPOs.filter((po) => po.status === 'Pending').length,
      purchaseOrders: filteredPOs,
    };
  }

  async getDailyPickingReport(date?: Date) {
    const targetDate = date || new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const queues = await this.pickingService.findAll();
    const filteredQueues = queues.filter((queue) => {
      const queueDate = new Date(queue.completedAt || queue.createdAt);
      return queueDate >= startDate && queueDate <= endDate;
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalQueues: filteredQueues.length,
      completedQueues: filteredQueues.filter((queue) => queue.status === 'Completed').length,
      pendingQueues: filteredQueues.filter((queue) => queue.status === 'Pending').length,
      queues: filteredQueues,
    };
  }

  async getDailyShipmentReport(date?: Date) {
    const targetDate = date || new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const shipments = await this.shipmentsService.findAll();
    const filteredShipments = shipments.filter((shipment) => {
      const shipmentDate = new Date(shipment.shippedAt || shipment.createdAt);
      return shipmentDate >= startDate && shipmentDate <= endDate;
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalShipments: filteredShipments.length,
      shippedShipments: filteredShipments.filter((s) => s.status === 'Shipped').length,
      pendingShipments: filteredShipments.filter((s) => s.status === 'Pending').length,
      shipments: filteredShipments,
    };
  }
}
