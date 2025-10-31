import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../picking/entities/order-queue.entity';
import { PickingItem } from '../../picking/entities/picking-item.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';

/**
 * Department Performance Report Service
 * Generates performance reports for each department (Receiving, Picking, QC, Packaging)
 */
@Injectable()
export class DepartmentPerformanceService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(OrderQueue)
    private orderQueueRepository: Repository<OrderQueue>,
    @InjectRepository(PickingItem)
    private pickingItemRepository: Repository<PickingItem>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  /**
   * Get performance report for all departments
   */
  async getDepartmentPerformanceReport(
    startDate?: Date,
    endDate?: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const [receiving, picking, qc, packaging] = await Promise.all([
      this.getReceivingPerformance(start, end, customerId, warehouseId),
      this.getPickingPerformance(start, end, customerId, warehouseId),
      this.getQCPerformance(start, end, customerId, warehouseId),
      this.getPackagingPerformance(start, end, customerId, warehouseId),
    ]);

    return {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      departments: {
        receiving,
        picking,
        qc,
        packaging,
      },
      overall: this.calculateOverallPerformance(receiving, picking, qc, packaging),
      generatedAt: new Date(),
    };
  }

  /**
   * Get Receiving Department performance
   */
  private async getReceivingPerformance(
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

    const periodPOs = pos.filter(
      (po) =>
        new Date(po.receivedAt || po.createdAt) >= startDate &&
        new Date(po.receivedAt || po.createdAt) <= endDate,
    );

    const totalPOs = periodPOs.length;
    const completedPOs = periodPOs.filter((po) => po.status === 'Completed').length;
    const completionRate = totalPOs > 0 ? (completedPOs / totalPOs) * 100 : 0;

    // Calculate average processing time
    const processedPOs = periodPOs.filter((po) => po.receivedAt);
    const avgProcessingTime = this.calculateAverageProcessingTime(processedPOs, 'receivedAt');

    // Calculate items received
    const totalItemsReceived = periodPOs.reduce(
      (sum, po) =>
        sum + po.items.reduce((itemSum, item) => itemSum + item.receivedQuantity, 0),
      0,
    );

    // Calculate throughput (POs per day)
    const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const throughput = totalPOs / days;

    // Calculate accuracy (based on expected vs received)
    const posWithAccuracy = periodPOs.filter((po) => po.items.length > 0);
    const accuracyRate =
      posWithAccuracy.length > 0
        ? posWithAccuracy.reduce((sum, po) => {
            const expectedTotal = po.items.reduce((s, item) => s + item.expectedQuantity, 0);
            const receivedTotal = po.items.reduce((s, item) => s + item.receivedQuantity, 0);
            return sum + (expectedTotal > 0 ? (receivedTotal / expectedTotal) * 100 : 100);
          }, 0) / posWithAccuracy.length
        : 100;

    return {
      department: 'Receiving',
      metrics: {
        totalPOs,
        completedPOs,
        completionRate: Math.round(completionRate * 100) / 100,
        totalItemsReceived,
        averageProcessingTime: avgProcessingTime,
        throughput: Math.round(throughput * 100) / 100,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      },
      performance: this.getPerformanceRating(completionRate, avgProcessingTime, accuracyRate),
    };
  }

  /**
   * Get Picking Department performance
   */
  private async getPickingPerformance(
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

    // Filter by customer if provided - need to load shipments separately if shipmentId exists
    let customerQueues = queues;
    if (customerId) {
      const shipments = await this.shipmentRepository.find({
        where: { customerId },
        select: ['id', 'customerId'],
      });
      const shipmentIds = new Set(shipments.map(s => s.id));
      customerQueues = queues.filter((q) => q.shipmentId && shipmentIds.has(q.shipmentId));
    }

    const periodQueues = customerQueues.filter(
      (q) =>
        new Date(q.completedAt || q.createdAt) >= startDate &&
        new Date(q.completedAt || q.createdAt) <= endDate,
    );

    const totalQueues = periodQueues.length;
    const completedQueues = periodQueues.filter((q) => q.status === 'Completed').length;
    const completionRate = totalQueues > 0 ? (completedQueues / totalQueues) * 100 : 0;

    // Calculate average processing time
    const processedQueues = periodQueues.filter((q) => q.completedAt);
    const avgProcessingTime = this.calculateAverageProcessingTime(processedQueues, 'completedAt');

    // Calculate items picked
    const totalItemsPicked = periodQueues.reduce(
      (sum, q) => sum + q.pickingItems.length,
      0,
    );

    // Calculate throughput
    const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const throughput = totalQueues / days;

    // Calculate accuracy (based on verified items)
    const verifiedItems = periodQueues.reduce(
      (sum, q) => sum + q.pickingItems.filter((item) => item.verified).length,
      0,
    );
    const accuracyRate = totalItemsPicked > 0 ? (verifiedItems / totalItemsPicked) * 100 : 100;

    return {
      department: 'Picking',
      metrics: {
        totalQueues,
        completedQueues,
        completionRate: Math.round(completionRate * 100) / 100,
        totalItemsPicked,
        averageProcessingTime: avgProcessingTime,
        throughput: Math.round(throughput * 100) / 100,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      },
      performance: this.getPerformanceRating(completionRate, avgProcessingTime, accuracyRate),
    };
  }

  /**
   * Get QC Department performance
   */
  private async getQCPerformance(
    startDate: Date,
    endDate: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    // QC performance is measured by shipments moved from Ready to Shipped status
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    const shipments = await this.shipmentRepository.find({ where });

    const periodShipments = shipments.filter(
      (s) =>
        new Date(s.createdAt) >= startDate &&
        new Date(s.createdAt) <= endDate,
    );

    const readyShipments = periodShipments.filter((s) => s.status === 'Ready');
    const shippedShipments = periodShipments.filter((s) => s.status === 'Shipped');

    // Calculate QC processing rate (Ready to Shipped)
    const qcProcessed = shippedShipments.length;
    const qcQueue = readyShipments.length;
    const processingRate = readyShipments.length > 0 ? (qcProcessed / (qcProcessed + qcQueue)) * 100 : 0;

    // Calculate average QC time (time between Ready and Shipped)
    const processedShipments = shippedShipments.filter((s) => {
      // In a real system, you'd track when shipment moved to Ready status
      // For now, we'll estimate based on createdAt
      return s.shippedAt && new Date(s.shippedAt) > new Date(s.createdAt);
    });

    const avgProcessingTime =
      processedShipments.length > 0
        ? processedShipments.reduce((sum, s) => {
            const timeDiff =
              (new Date(s.shippedAt!).getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60);
            return sum + timeDiff;
          }, 0) / processedShipments.length
        : 0;

    // Calculate accuracy (based on shipment errors)
    // In a real system, you'd track QC errors/discrepancies
    const accuracyRate = 98; // Placeholder

    return {
      department: 'QC',
      metrics: {
        totalShipments: periodShipments.length,
        readyShipments: qcQueue,
        shippedShipments: qcProcessed,
        processingRate: Math.round(processingRate * 100) / 100,
        averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        accuracyRate,
      },
      performance: this.getPerformanceRating(processingRate, avgProcessingTime, accuracyRate),
    };
  }

  /**
   * Get Packaging Department performance
   */
  private async getPackagingPerformance(
    startDate: Date,
    endDate: Date,
    customerId?: string,
    warehouseId?: string,
  ): Promise<any> {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (warehouseId) where.warehouseId = warehouseId;

    const shipments = await this.shipmentRepository.find({ where });

    const periodShipments = shipments.filter(
      (s) =>
        new Date(s.shippedAt || s.createdAt) >= startDate &&
        new Date(s.shippedAt || s.createdAt) <= endDate,
    );

    const shippedShipments = periodShipments.filter((s) => s.status === 'Shipped');
    const packagingRate = periodShipments.length > 0 ? (shippedShipments.length / periodShipments.length) * 100 : 0;

    // Calculate average packaging time
    const processedShipments = shippedShipments.filter((s) => s.shippedAt);
    const avgProcessingTime =
      processedShipments.length > 0
        ? processedShipments.reduce((sum, s) => {
            const timeDiff =
              (new Date(s.shippedAt!).getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60);
            return sum + timeDiff;
          }, 0) / processedShipments.length
        : 0;

    const totalItemsPackaged = shippedShipments.reduce((sum, s) => sum + s.fulfilledQuantity, 0);

    // Calculate throughput
    const days = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const throughput = shippedShipments.length / days;

    return {
      department: 'Packaging',
      metrics: {
        totalShipments: periodShipments.length,
        shippedShipments: shippedShipments.length,
        packagingRate: Math.round(packagingRate * 100) / 100,
        totalItemsPackaged,
        averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        throughput: Math.round(throughput * 100) / 100,
      },
      performance: this.getPerformanceRating(packagingRate, avgProcessingTime, 98),
    };
  }

  /**
   * Calculate average processing time in hours
   */
  private calculateAverageProcessingTime(items: any[], completionField: string): number {
    const itemsWithCompletion = items.filter((item) => item[completionField]);
    if (itemsWithCompletion.length === 0) return 0;

    const totalTime = itemsWithCompletion.reduce((sum, item) => {
      const timeDiff =
        (new Date(item[completionField]).getTime() - new Date(item.createdAt).getTime()) /
        (1000 * 60 * 60);
      return sum + timeDiff;
    }, 0);

    return Math.round((totalTime / itemsWithCompletion.length) * 100) / 100;
  }

  /**
   * Get performance rating (Excellent, Good, Fair, Poor)
   */
  private getPerformanceRating(
    completionRate: number,
    avgProcessingTime: number,
    accuracyRate: number,
  ): string {
    let score = 0;

    // Completion rate (40% weight)
    if (completionRate >= 95) score += 40;
    else if (completionRate >= 85) score += 30;
    else if (completionRate >= 75) score += 20;
    else score += 10;

    // Processing time (30% weight) - lower is better
    if (avgProcessingTime <= 4) score += 30;
    else if (avgProcessingTime <= 8) score += 20;
    else if (avgProcessingTime <= 12) score += 10;
    else score += 5;

    // Accuracy (30% weight)
    if (accuracyRate >= 98) score += 30;
    else if (accuracyRate >= 95) score += 20;
    else if (accuracyRate >= 90) score += 10;
    else score += 5;

    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    return 'Poor';
  }

  /**
   * Calculate overall performance
   */
  private calculateOverallPerformance(...departments: any[]): any {
    const totalDepartments = departments.length;
    const excellent = departments.filter((d) => d.performance === 'Excellent').length;
    const good = departments.filter((d) => d.performance === 'Good').length;
    const fair = departments.filter((d) => d.performance === 'Fair').length;
    const poor = departments.filter((d) => d.performance === 'Poor').length;

    const overallScore = (excellent * 4 + good * 3 + fair * 2 + poor * 1) / totalDepartments;

    let overallRating = 'Poor';
    if (overallScore >= 3.5) overallRating = 'Excellent';
    else if (overallScore >= 2.5) overallRating = 'Good';
    else if (overallScore >= 1.5) overallRating = 'Fair';

    return {
      overallRating,
      score: Math.round(overallScore * 100) / 100,
      distribution: {
        excellent,
        good,
        fair,
        poor,
      },
    };
  }
}
