import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { PurchaseOrder } from '../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../picking/entities/order-queue.entity';
import { BillingInvoice } from '../../billing/entities/billing-invoice.entity';
import { FreightBooking } from '../../freight-booking/entities/freight-booking.entity';
import { WarehouseLocation } from '../../warehouse/entities/warehouse-location.entity';

/**
 * Insight Reports Service
 * Generates high-level management reports with KPIs, trends, and financial metrics
 */
@Injectable()
export class InsightReportsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(OrderQueue)
    private orderQueueRepository: Repository<OrderQueue>,
    @InjectRepository(BillingInvoice)
    private invoiceRepository: Repository<BillingInvoice>,
    @InjectRepository(FreightBooking)
    private freightBookingRepository: Repository<FreightBooking>,
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Get executive insight report
   */
  async getExecutiveInsightReport(
    startDate?: Date,
    endDate?: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const [
      shipmentMetrics,
      inventoryMetrics,
      financialMetrics,
      operationalMetrics,
      trends,
    ] = await Promise.all([
      this.getShipmentMetrics(start, end, customerId, warehouseId),
      this.getInventoryMetrics(customerId, warehouseId),
      this.getFinancialMetrics(start, end, customerId),
      this.getOperationalMetrics(start, end, customerId, warehouseId),
      this.getTrends(start, end, customerId, warehouseId),
    ]);

    return {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      kpis: {
        shipmentMetrics,
        inventoryMetrics,
        financialMetrics,
        operationalMetrics,
      },
      trends,
      insights: await this.generateInsights(shipmentMetrics, inventoryMetrics, financialMetrics, operationalMetrics),
      generatedAt: new Date(),
    };
  }

  /**
   * Get shipment metrics
   */
  private async getShipmentMetrics(
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

    const periodShipments = shipments.filter(
      (s) =>
        new Date(s.createdAt) >= startDate &&
        new Date(s.createdAt) <= endDate,
    );

    const totalShipments = periodShipments.length;
    const shipped = periodShipments.filter((s) => s.status === 'Shipped' || s.status === 'Partially Shipped').length;
    const totalQuantity = periodShipments.reduce((sum, s) => sum + s.totalQuantity, 0);
    const fulfilledQuantity = periodShipments.reduce((sum, s) => sum + s.fulfilledQuantity, 0);
    const fulfillmentRate = totalQuantity > 0 ? (fulfilledQuantity / totalQuantity) * 100 : 0;
    const averageOrderValue = totalShipments > 0 ? totalQuantity / totalShipments : 0;

    // Calculate on-time delivery (assuming shipped within 5 days of creation)
    const onTimeShipments = periodShipments.filter((s) => {
      if (!s.shippedAt) return false;
      const daysToShip = (new Date(s.shippedAt).getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysToShip <= 5;
    });
    const onTimeDeliveryRate = totalShipments > 0 ? (onTimeShipments.length / totalShipments) * 100 : 0;

    return {
      totalShipments,
      shippedShipments: shipped,
      shipmentRate: totalShipments > 0 ? (shipped / totalShipments) * 100 : 0,
      totalQuantity,
      fulfilledQuantity,
      fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
    };
  }

  /**
   * Get inventory metrics
   */
  private async getInventoryMetrics(customerId?: string, warehouseId?: string): Promise<any> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    const inventory = await this.inventoryRepository.find({ where });
    const locations = await this.locationRepository.find({ where: warehouseId ? { warehouseId } : {} });

    const totalItems = inventory.length;
    const readyItems = inventory.filter((i) => i.status === 'Ready').length;
    const totalSKUs = new Set(inventory.map((i) => i.sku)).size;

    const totalCapacity = locations.reduce((sum, l) => sum + (l.maxCapacity || 0), 0);
    const currentCapacity = locations.reduce((sum, l) => sum + (l.currentCapacity || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (currentCapacity / totalCapacity) * 100 : 0;

    return {
      totalItems,
      readyItems,
      totalSKUs,
      totalCapacity,
      currentCapacity,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      availableCapacity: totalCapacity - currentCapacity,
    };
  }

  /**
   * Get financial metrics
   */
  private async getFinancialMetrics(
    startDate: Date,
    endDate: Date,
    customerId?: string,
  ): Promise<any> {
    const where: any = {};
    if (customerId) where.customerId = customerId;

    const invoices = await this.invoiceRepository.find({ where });
    const periodInvoices = invoices.filter(
      (inv) =>
        new Date(inv.issueDate) >= startDate &&
        new Date(inv.issueDate) <= endDate,
    );

    const totalRevenue = periodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidRevenue = periodInvoices.filter((inv) => inv.status === 'Paid').reduce(
      (sum, inv) => sum + (inv.total || 0),
      0,
    );
    const pendingRevenue = totalRevenue - paidRevenue;
    const averageInvoiceValue = periodInvoices.length > 0 ? totalRevenue / periodInvoices.length : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      paidRevenue: Math.round(paidRevenue * 100) / 100,
      pendingRevenue: Math.round(pendingRevenue * 100) / 100,
      totalInvoices: periodInvoices.length,
      averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
      paymentRate: totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0,
    };
  }

  /**
   * Get operational metrics
   */
  private async getOperationalMetrics(
    startDate: Date,
    endDate: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const wherePO: any = {};
    const whereQueue: any = {};
    if (customerId) {
      wherePO.customerId = customerId;
      whereQueue.shipment = { customerId };
    }
    if (warehouseId) {
      wherePO.warehouseId = warehouseId;
    }

    const pos = await this.purchaseOrderRepository.find({ where: wherePO });
    const queues = await this.orderQueueRepository.find({
      where: whereQueue,
      relations: ['shipment'],
    });

    const periodPOs = pos.filter(
      (po) =>
        new Date(po.receivedAt || po.createdAt) >= startDate &&
        new Date(po.receivedAt || po.createdAt) <= endDate,
    );

    const periodQueues = queues.filter(
      (q) =>
        new Date(q.completedAt || q.createdAt) >= startDate &&
        new Date(q.completedAt || q.createdAt) <= endDate,
    );

    // Calculate average processing times
    const avgReceivingTime = this.calculateAverageProcessingTime(periodPOs, 'receivedAt');
    const avgPickingTime = this.calculateAverageProcessingTime(periodQueues, 'completedAt');

    // Calculate throughput
    const receivingThroughput = periodPOs.length / ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const pickingThroughput = periodQueues.length / ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      receiving: {
        totalPOs: periodPOs.length,
        completedPOs: periodPOs.filter((po) => po.status === 'Completed').length,
        averageProcessingTime: avgReceivingTime,
        throughput: Math.round(receivingThroughput * 100) / 100,
      },
      picking: {
        totalQueues: periodQueues.length,
        completedQueues: periodQueues.filter((q) => q.status === 'Completed').length,
        averageProcessingTime: avgPickingTime,
        throughput: Math.round(pickingThroughput * 100) / 100,
      },
    };
  }

  /**
   * Calculate average processing time in hours
   */
  private calculateAverageProcessingTime(items: any[], completionField: string): number {
    const itemsWithCompletion = items.filter((item) => item[completionField]);
    if (itemsWithCompletion.length === 0) return 0;

    const totalTime = itemsWithCompletion.reduce((sum, item) => {
      const timeDiff = new Date(item[completionField]).getTime() - new Date(item.createdAt).getTime();
      return sum + timeDiff / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return Math.round((totalTime / itemsWithCompletion.length) * 100) / 100;
  }

  /**
   * Get trends
   */
  private async getTrends(
    startDate: Date,
    endDate: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyData: any[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const where: any = {};
      if (customerId) where.customerId = customerId;
      if (warehouseId) where.warehouseId = warehouseId;

      const shipments = await this.shipmentRepository.find({ where });
      const dayShipments = shipments.filter(
        (s) =>
          new Date(s.createdAt) >= date &&
          new Date(s.createdAt) < nextDate,
      );

      dailyData.push({
        date: date.toISOString().split('T')[0],
        shipments: dayShipments.length,
        quantity: dayShipments.reduce((sum, s) => sum + s.totalQuantity, 0),
      });
    }

    return {
      dailyShipments: dailyData,
      trend: this.calculateTrend(dailyData.map((d) => d.shipments)),
    };
  }

  /**
   * Calculate trend (increasing, decreasing, stable)
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate insights from metrics
   */
  private async generateInsights(
    shipmentMetrics: any,
    inventoryMetrics: any,
    financialMetrics: any,
    operationalMetrics: any,
  ): Promise<any[]> {
    const insights: any[] = [];

    // Fulfillment rate insight
    if (shipmentMetrics.fulfillmentRate < 90) {
      insights.push({
        type: 'warning',
        category: 'Fulfillment',
        message: `Fulfillment rate is ${shipmentMetrics.fulfillmentRate}%, below target of 90%`,
        recommendation: 'Review inventory levels and picking processes',
      });
    }

    // Inventory utilization insight
    if (inventoryMetrics.utilizationRate > 85) {
      insights.push({
        type: 'alert',
        category: 'Inventory',
        message: `Warehouse utilization is ${inventoryMetrics.utilizationRate}%, approaching capacity`,
        recommendation: 'Consider expanding capacity or optimizing storage',
      });
    }

    // On-time delivery insight
    if (shipmentMetrics.onTimeDeliveryRate < 95) {
      insights.push({
        type: 'warning',
        category: 'Operations',
        message: `On-time delivery rate is ${shipmentMetrics.onTimeDeliveryRate}%, below target of 95%`,
        recommendation: 'Optimize picking and packaging processes',
      });
    }

    // Payment rate insight
    if (financialMetrics.paymentRate < 80) {
      insights.push({
        type: 'warning',
        category: 'Finance',
        message: `Payment rate is ${financialMetrics.paymentRate}%, below target of 80%`,
        recommendation: 'Follow up on outstanding invoices',
      });
    }

    return insights;
  }

  /**
   * Get financial summary report
   */
  async getFinancialSummaryReport(startDate?: Date, endDate?: Date, customerId?: string): Promise<any> {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const financialMetrics = await this.getFinancialMetrics(start, end, customerId);
    const invoices = await this.invoiceRepository.find({
      where: customerId ? { customerId } : {},
    });

    const periodInvoices = invoices.filter(
      (inv) =>
        new Date(inv.issueDate) >= start &&
        new Date(inv.issueDate) <= end,
    );

    // Revenue by month
    const revenueByMonth = this.groupByMonth(periodInvoices, 'issueDate', 'total');

    return {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      summary: financialMetrics,
      revenueByMonth,
      topCustomers: await this.getTopCustomersByRevenue(start, end),
      generatedAt: new Date(),
    };
  }

  /**
   * Group data by month
   */
  private groupByMonth(items: any[], dateField: string, valueField: string): any[] {
    const grouped: Record<string, number> = {};

    items.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[monthKey] = (grouped[monthKey] || 0) + (item[valueField] || 0);
    });

    return Object.entries(grouped).map(([month, value]) => ({
      month,
      value: Math.round(value * 100) / 100,
    }));
  }

  /**
   * Get top customers by revenue
   */
  private async getTopCustomersByRevenue(startDate: Date, endDate: Date, limit: number = 10): Promise<any[]> {
    const invoices = await this.invoiceRepository.find({
      relations: ['customer'],
    });

    const periodInvoices = invoices.filter(
      (inv) =>
        new Date(inv.issueDate) >= startDate &&
        new Date(inv.issueDate) <= endDate,
    );

    const customerRevenue: Record<string, number> = {};

    periodInvoices.forEach((inv) => {
      const customerId = inv.customerId;
      customerRevenue[customerId] = (customerRevenue[customerId] || 0) + (inv.total || 0);
    });

    return Object.entries(customerRevenue)
      .map(([customerId, revenue]) => ({
        customerId,
        revenue: Math.round(revenue * 100) / 100,
        customerName: periodInvoices.find((inv) => inv.customerId === customerId)?.customer?.name || 'Unknown',
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}
