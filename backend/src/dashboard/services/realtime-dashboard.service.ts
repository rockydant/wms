import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { PurchaseOrder } from '../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../picking/entities/order-queue.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { WarehouseLocation } from '../../warehouse/entities/warehouse-location.entity';

/**
 * Real-Time Dashboard Service for Daily Operations
 * Provides real-time updates for warehouse operations
 */
@Injectable()
export class RealtimeDashboardService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(OrderQueue)
    private orderQueueRepository: Repository<OrderQueue>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Get real-time dashboard data for daily operations
   */
  async getRealtimeDashboard(
    warehouseId?: string,
    customerId?: string,
  ): Promise<any> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayReceiving,
      todayPicking,
      todayShipping,
      inventoryStatus,
      warehouseStatus,
      activeOperations,
      alerts,
    ] = await Promise.all([
      this.getTodayReceiving(todayStart, todayEnd, customerId, warehouseId),
      this.getTodayPicking(todayStart, todayEnd, customerId, warehouseId),
      this.getTodayShipping(todayStart, todayEnd, customerId, warehouseId),
      this.getInventoryStatus(customerId, warehouseId),
      this.getWarehouseStatus(warehouseId),
      this.getActiveOperations(warehouseId),
      this.getAlerts(customerId, warehouseId),
    ]);

    return {
      timestamp: now.toISOString(),
      today: {
        receiving: todayReceiving,
        picking: todayPicking,
        shipping: todayShipping,
      },
      inventory: inventoryStatus,
      warehouse: warehouseStatus,
      activeOperations,
      alerts,
      summary: this.calculateSummary(todayReceiving, todayPicking, todayShipping),
    };
  }

  /**
   * Get today's receiving operations
   */
  private async getTodayReceiving(
    startDate: Date,
    endDate: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    const pos = await this.purchaseOrderRepository.find({
      where,
      relations: ['items'],
    });

    const todayPOs = pos.filter((po) => {
      const poDate = new Date(po.receivedAt || po.createdAt);
      return poDate >= startDate && poDate <= endDate;
    });

    const inProgress = todayPOs.filter((po) => po.status === 'Pending').length;
    const completed = todayPOs.filter((po) => po.status === 'Completed').length;
    const totalItems = todayPOs.reduce(
      (sum, po) => sum + po.items.reduce((s, item) => s + item.receivedQuantity, 0),
      0,
    );

    return {
      totalPOs: todayPOs.length,
      inProgress,
      completed,
      totalItems,
      completionRate: todayPOs.length > 0 ? (completed / todayPOs.length) * 100 : 0,
      recentPOs: todayPOs.slice(-5).map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        itemsReceived: po.items.reduce((s, item) => s + item.receivedQuantity, 0),
        receivedAt: po.receivedAt,
      })),
    };
  }

  /**
   * Get today's picking operations
   */
  private async getTodayPicking(
    startDate: Date,
    endDate: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const queues = await this.orderQueueRepository.find({
      where,
      relations: ['pickingItems'],
    });

    // Filter by customer if needed - load shipments separately if shipmentId exists
    let customerQueues = queues;
    if (customerId) {
      const shipments = await this.shipmentRepository.find({
        where: { customerId },
        select: ['id', 'customerId'],
      });
      const shipmentIds = new Set(shipments.map(s => s.id));
      customerQueues = queues.filter((q) => q.shipmentId && shipmentIds.has(q.shipmentId));
    }

    const todayQueues = customerQueues.filter((q) => {
      const queueDate = new Date(q.completedAt || q.createdAt);
      return queueDate >= startDate && queueDate <= endDate;
    });

    const pending = todayQueues.filter((q) => q.status === 'Pending').length;
    const inProgress = todayQueues.filter((q) => q.status === 'In Progress').length;
    const completed = todayQueues.filter((q) => q.status === 'Completed').length;
    const totalItems = todayQueues.reduce((sum, q) => sum + q.pickingItems.length, 0);

    return {
      totalQueues: todayQueues.length,
      pending,
      inProgress,
      completed,
      totalItems,
      completionRate: todayQueues.length > 0 ? (completed / todayQueues.length) * 100 : 0,
      activeQueues: todayQueues.filter((q) => q.status !== 'Completed').slice(0, 5).map((q) => ({
        id: q.id,
        priority: q.priority,
        status: q.status,
        itemsCount: q.pickingItems.length,
        assignedTo: q.assignedTo,
      })),
    };
  }

  /**
   * Get today's shipping operations
   */
  private async getTodayShipping(
    startDate: Date,
    endDate: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    const shipments = await this.shipmentRepository.find({
      where,
      relations: ['items'],
    });

    const todayShipments = shipments.filter((s) => {
      const shipmentDate = new Date(s.shippedAt || s.createdAt);
      return shipmentDate >= startDate && shipmentDate <= endDate;
    });

    const pending = todayShipments.filter((s) => s.status === 'Pending').length;
    const ready = todayShipments.filter((s) => s.status === 'Ready').length;
    const shipped = todayShipments.filter((s) => s.status === 'Shipped' || s.status === 'Partially Shipped').length;
    const totalQuantity = todayShipments.reduce((sum, s) => sum + s.totalQuantity, 0);
    const fulfilledQuantity = todayShipments.reduce((sum, s) => sum + s.fulfilledQuantity, 0);

    return {
      totalShipments: todayShipments.length,
      pending,
      ready,
      shipped,
      totalQuantity,
      fulfilledQuantity,
      fulfillmentRate: totalQuantity > 0 ? (fulfilledQuantity / totalQuantity) * 100 : 0,
      recentShipments: todayShipments.slice(-5).map((s) => ({
        id: s.id,
        status: s.status,
        quantity: s.totalQuantity,
        fulfilled: s.fulfilledQuantity,
        shippedAt: s.shippedAt,
      })),
    };
  }

  /**
   * Get inventory status
   */
  private async getInventoryStatus(customerId?: string, warehouseId?: string): Promise<any> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    const inventory = await this.inventoryRepository.find({ where });

    const totalItems = inventory.length;
    const readyItems = inventory.filter((i) => i.status === 'Ready').length;
    const lowStock = totalItems < 100; // Threshold for low stock

    return {
      totalItems,
      readyItems,
      lowStock,
      status: readyItems > 0 ? 'Active' : 'Empty',
    };
  }

  /**
   * Get warehouse status
   */
  private async getWarehouseStatus(warehouseId?: string): Promise<any> {
    const where = warehouseId ? { warehouseId } : {};
    const locations = await this.locationRepository.find({ where });

    const totalLocations = locations.length;
    const utilizedLocations = locations.filter((l) => l.currentCapacity > 0).length;
    const utilizationRate = totalLocations > 0 ? (utilizedLocations / totalLocations) * 100 : 0;
    const highUtilization = locations.filter((l) => (l.utilizationPercentage || 0) > 85).length;

    return {
      totalLocations,
      utilizedLocations,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      highUtilization,
      status: utilizationRate > 85 ? 'High' : utilizationRate > 60 ? 'Medium' : 'Low',
    };
  }

  /**
   * Get active operations
   */
  private async getActiveOperations(warehouseId?: string): Promise<any> {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const pos = await this.purchaseOrderRepository.find({
      where,
      relations: ['items'],
    });

    const queues = await this.orderQueueRepository.find({
      where,
      relations: ['pickingItems'],
    });

    const activePOs = pos.filter((po) => po.status === 'Pending').length;
    const activeQueues = queues.filter((q) => q.status === 'Pending' || q.status === 'In Progress').length;

    return {
      activeReceiving: activePOs,
      activePicking: activeQueues,
      totalActive: activePOs + activeQueues,
    };
  }

  /**
   * Get alerts
   */
  private async getAlerts(customerId?: string, warehouseId?: string): Promise<any[]> {
    const alerts: any[] = [];

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    // Check for old pending shipments
    const shipments = await this.shipmentRepository.find({ where });
    const oldPending = shipments.filter((s) => {
      if (s.status !== 'Pending') return false;
      const daysOld = (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > 3;
    });

    if (oldPending.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'Shipments',
        message: `${oldPending.length} shipments pending for more than 3 days`,
        priority: 'high',
      });
    }

    // Check for low inventory
    const inventory = await this.inventoryRepository.find({ where });
    if (inventory.length < 50) {
      alerts.push({
        type: 'warning',
        category: 'Inventory',
        message: 'Low inventory levels detected',
        priority: 'medium',
      });
    }

    return alerts;
  }

  /**
   * Calculate summary
   */
  private calculateSummary(receiving: any, picking: any, shipping: any): any {
    return {
      totalOperations: receiving.totalPOs + picking.totalQueues + shipping.totalShipments,
      completedOperations: receiving.completed + picking.completed + shipping.shipped,
      overallCompletionRate:
        receiving.totalPOs + picking.totalQueues + shipping.totalShipments > 0
          ? ((receiving.completed + picking.completed + shipping.shipped) /
              (receiving.totalPOs + picking.totalQueues + shipping.totalShipments)) *
            100
          : 0,
    };
  }
}
