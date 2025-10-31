import { Injectable } from '@nestjs/common';
import { ShipmentsService } from '../shipments/shipments.service';
import { InventoryService } from '../inventory/inventory.service';
import { PickingService } from '../picking/picking.service';
import { ReceivingService } from '../receiving/receiving.service';
import { WarehouseService } from '../warehouse/warehouse.service';
import { ReportsService } from '../reports/reports.service';
import { AnomalyDetectionService } from '../inventory/services/anomaly-detection.service';

/**
 * Real-time Performance Dashboard Service
 * Aggregates data from multiple modules for dashboard views
 */
@Injectable()
export class DashboardService {
  constructor(
    private shipmentsService: ShipmentsService,
    private inventoryService: InventoryService,
    private pickingService: PickingService,
    private receivingService: ReceivingService,
    private warehouseService: WarehouseService,
    private reportsService: ReportsService,
    private anomalyDetectionService: AnomalyDetectionService,
  ) {}

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(customerId?: string, warehouseId?: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      shipments,
      inventory,
      orderQueues,
      purchaseOrders,
      warehouseStats,
      todayReports,
      anomalies,
    ] = await Promise.all([
      this.getShipmentMetrics(customerId, warehouseId),
      this.getInventoryMetrics(customerId),
      this.getPickingMetrics(customerId, warehouseId),
      this.getReceivingMetrics(customerId),
      this.getWarehouseMetrics(warehouseId),
      this.getTodayReports(),
      this.anomalyDetectionService.getAnomalySummary(customerId),
    ]);

    return {
      overview: {
        shipments,
        inventory,
        picking: orderQueues,
        receiving: purchaseOrders,
        warehouse: warehouseStats,
      },
      performance: {
        today: todayReports,
        trends: await this.getPerformanceTrends(customerId, warehouseId),
      },
      alerts: {
        anomalies,
        critical: await this.getCriticalAlerts(customerId, warehouseId),
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Get shipment metrics
   */
  private async getShipmentMetrics(customerId?: string, warehouseId?: string): Promise<any> {
    const shipments = customerId
      ? await this.shipmentsService.findByCustomer(customerId, warehouseId)
      : await this.shipmentsService.findAll(warehouseId);

    const total = shipments.length;
    const pending = shipments.filter((s) => s.status === 'Pending').length;
    const ready = shipments.filter((s) => s.status === 'Ready').length;
    const shipped = shipments.filter((s) => s.status === 'Shipped' || s.status === 'Partially Shipped').length;

    const totalQuantity = shipments.reduce((sum, s) => sum + s.totalQuantity, 0);
    const fulfilledQuantity = shipments.reduce((sum, s) => sum + s.fulfilledQuantity, 0);
    const fulfillmentRate = totalQuantity > 0 ? (fulfilledQuantity / totalQuantity) * 100 : 0;

    return {
      total,
      byStatus: { pending, ready, shipped },
      fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
      totalQuantity,
      fulfilledQuantity,
    };
  }

  /**
   * Get inventory metrics
   */
  private async getInventoryMetrics(customerId?: string): Promise<any> {
    const items = customerId
      ? await this.inventoryService.findByCustomer(customerId)
      : await this.inventoryService.findAll();

    const total = items.length;
    const byStatus = {
      received: items.filter((i) => i.status === 'Received').length,
      ready: items.filter((i) => i.status === 'Ready').length,
      picked: items.filter((i) => i.status === 'Picked').length,
      shipped: items.filter((i) => i.status === 'Shipped').length,
    };

    const located = items.filter((i) => i.locationId).length;
    const locationRate = total > 0 ? (located / total) * 100 : 0;

    return {
      total,
      byStatus,
      locationRate: Math.round(locationRate * 100) / 100,
      located,
      unlocated: total - located,
    };
  }

  /**
   * Get picking metrics
   */
  private async getPickingMetrics(customerId?: string, warehouseId?: string): Promise<any> {
    const queues = await this.pickingService.findAll();

    const total = queues.length;
    const pending = queues.filter((q) => q.status === 'Pending').length;
    const inProgress = queues.filter((q) => q.status === 'In Progress').length;
    const completed = queues.filter((q) => q.status === 'Completed').length;

    const avgCompletionTime = await this.calculateAvgCompletionTime(queues);

    return {
      total,
      byStatus: { pending, inProgress, completed },
      avgCompletionTime,
    };
  }

  /**
   * Get receiving metrics
   */
  private async getReceivingMetrics(customerId?: string): Promise<any> {
    const pos = await this.receivingService.findAll();

    const total = pos.length;
    const pending = pos.filter((po) => po.status === 'Pending').length;
    const inProgress = pos.filter((po) => po.status === 'In Progress').length;
    const completed = pos.filter((po) => po.status === 'Completed').length;

    return {
      total,
      byStatus: { pending, inProgress, completed },
    };
  }

  /**
   * Get warehouse metrics
   */
  private async getWarehouseMetrics(warehouseId?: string): Promise<any> {
    const locations = warehouseId
      ? await this.warehouseService.findByWarehouse(warehouseId)
      : await this.warehouseService.findAll();

    const total = locations.length;
    const totalCapacity = locations.reduce((sum, l) => sum + (l.maxCapacity || 0), 0);
    const totalUtilization = locations.reduce((sum, l) => sum + (l.utilizationCount || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0;

    const overutilized = locations.filter((l) => {
      const util = (l.utilizationCount || 0) / (l.maxCapacity || 1);
      return util > 0.9;
    }).length;

    const underutilized = locations.filter((l) => {
      const util = (l.utilizationCount || 0) / (l.maxCapacity || 1);
      return util < 0.2;
    }).length;

    return {
      totalLocations: total,
      totalCapacity,
      totalUtilization,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      overutilized,
      underutilized,
    };
  }

  /**
   * Get today's reports
   */
  private async getTodayReports(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const receiving = await this.reportsService.getDailyReceivingReport(today);
      const picking = await this.reportsService.getDailyPickingReport(today);
      const shipments = await this.reportsService.getDailyShipmentReport(today);

      return {
        receiving: receiving || { total: 0 },
        picking: picking || { total: 0 },
        shipments: shipments || { total: 0 },
      };
    } catch {
      return {
        receiving: { total: 0 },
        picking: { total: 0 },
        shipments: { total: 0 },
      };
    }
  }

  /**
   * Get performance trends
   */
  private async getPerformanceTrends(customerId?: string, warehouseId?: string): Promise<any> {
    // Last 7 days trend
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      try {
        const dayReport = await this.reportsService.getDailyShipmentReport(dateStr);
        trends.push({
          date: dateStr,
          shipments: dayReport?.total || 0,
        });
      } catch {
        trends.push({
          date: dateStr,
          shipments: 0,
        });
      }
    }

    return {
      last7Days: trends,
      trendDirection: this.calculateTrendDirection(trends),
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrendDirection(trends: any[]): 'up' | 'down' | 'stable' {
    if (trends.length < 2) return 'stable';

    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));

    const firstAvg = firstHalf.reduce((sum, t) => sum + t.shipments, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.shipments, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'up';
    if (secondAvg < firstAvg * 0.9) return 'down';
    return 'stable';
  }

  /**
   * Calculate average completion time for order queues
   */
  private async calculateAvgCompletionTime(queues: any[]): Promise<number> {
    const completed = queues.filter((q) => q.status === 'Completed' && q.startedAt && q.completedAt);

    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, q) => {
      const start = new Date(q.startedAt).getTime();
      const end = new Date(q.completedAt).getTime();
      return sum + (end - start);
    }, 0);

    return Math.round(totalTime / completed.length / 1000 / 60); // minutes
  }

  /**
   * Get critical alerts
   */
  private async getCriticalAlerts(customerId?: string, warehouseId?: string): Promise<any[]> {
    const alerts: any[] = [];

    // Check for critical inventory levels
    const inventory = customerId
      ? await this.inventoryService.findByCustomer(customerId)
      : await this.inventoryService.findAll();

    const unlocatedItems = inventory.filter((i) => !i.locationId);
    if (unlocatedItems.length > 10) {
      alerts.push({
        type: 'unlocated_inventory',
        severity: 'high',
        count: unlocatedItems.length,
        message: `${unlocatedItems.length} items are missing location assignments`,
      });
    }

    // Check for pending shipments
    const shipments = customerId
      ? await this.shipmentsService.findByCustomer(customerId, warehouseId)
      : await this.shipmentsService.findAll(warehouseId);

    const oldPending = shipments.filter((s) => {
      if (s.status !== 'Pending') return false;
      const age = Date.now() - new Date(s.createdAt).getTime();
      return age > 7 * 24 * 60 * 60 * 1000; // Older than 7 days
    });

    if (oldPending.length > 0) {
      alerts.push({
        type: 'old_pending_shipments',
        severity: 'medium',
        count: oldPending.length,
        message: `${oldPending.length} shipments have been pending for over 7 days`,
      });
    }

    return alerts;
  }

  /**
   * Get real-time metrics for WebSocket streaming
   */
  async getRealtimeMetrics(customerId?: string, warehouseId?: string): Promise<any> {
    const [shipments, inventory, picking] = await Promise.all([
      this.getShipmentMetrics(customerId, warehouseId),
      this.getInventoryMetrics(customerId),
      this.getPickingMetrics(customerId, warehouseId),
    ]);

    return {
      timestamp: new Date(),
      shipments: {
        total: shipments.total,
        shipped: shipments.byStatus.shipped,
        fulfillmentRate: shipments.fulfillmentRate,
      },
      inventory: {
        total: inventory.total,
        locationRate: inventory.locationRate,
      },
      picking: {
        total: picking.total,
        completed: picking.byStatus.completed,
        avgCompletionTime: picking.avgCompletionTime,
      },
    };
  }
}
