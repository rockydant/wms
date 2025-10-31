import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { PickingItem } from '../../picking/entities/picking-item.entity';

/**
 * Inventory Anomaly Detection Service
 * Detects unusual patterns in inventory movements, stock levels, and operations
 */
@Injectable()
export class AnomalyDetectionService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(PickingItem)
    private pickingRepository: Repository<PickingItem>,
  ) {}

  /**
   * Detect anomalies across all customers or a specific customer
   */
  async detectAnomalies(customerId?: string, days: number = 7): Promise<any> {
    const anomalies: any[] = [];

    // Detect various types of anomalies
    anomalies.push(...(await this.detectStockAnomalies(customerId, days)));
    anomalies.push(...(await this.detectMovementAnomalies(customerId, days)));
    anomalies.push(...(await this.detectLocationAnomalies(customerId, days)));
    anomalies.push(...(await this.detectSKUAnomalies(customerId, days)));

    // Sort by severity
    anomalies.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return {
      customerId,
      detectedAt: new Date(),
      period: days,
      totalAnomalies: anomalies.length,
      bySeverity: {
        critical: anomalies.filter((a) => a.severity === 'critical').length,
        high: anomalies.filter((a) => a.severity === 'high').length,
        medium: anomalies.filter((a) => a.severity === 'medium').length,
        low: anomalies.filter((a) => a.severity === 'low').length,
      },
      anomalies,
    };
  }

  /**
   * Detect stock level anomalies
   */
  private async detectStockAnomalies(customerId?: string, days: number = 7): Promise<any[]> {
    const anomalies: any[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const query = this.inventoryRepository
      .createQueryBuilder('item')
      .select('item.sku', 'sku')
      .addSelect('COUNT(*)', 'count')
      .groupBy('item.sku');

    if (customerId) {
      query.where('item.customerId = :customerId', { customerId });
    }

    query.andWhere('item.createdAt >= :date', { date: cutoffDate });

    const skuCounts = await query.getRawMany();

    // Find SKUs with unusually high or low stock
    const avgCount = skuCounts.reduce((sum, item) => sum + parseInt(item.count), 0) / skuCounts.length;

    for (const skuData of skuCounts) {
      const count = parseInt(skuData.count);
      const deviation = Math.abs(count - avgCount) / avgCount;

      if (deviation > 2 && count > avgCount * 3) {
        anomalies.push({
          type: 'excessive_stock',
          severity: 'high',
          sku: skuData.sku,
          currentStock: count,
          averageStock: Math.round(avgCount),
          deviation: Math.round(deviation * 100),
          message: `SKU ${skuData.sku} has ${count} units, which is ${Math.round(deviation * 100)}% above average`,
          recommendation: 'Review order patterns and consider reducing stock level',
        });
      } else if (deviation > 0.5 && count < avgCount * 0.3) {
        anomalies.push({
          type: 'low_stock',
          severity: 'medium',
          sku: skuData.sku,
          currentStock: count,
          averageStock: Math.round(avgCount),
          deviation: Math.round(deviation * 100),
          message: `SKU ${skuData.sku} has only ${count} units, which is ${Math.round(deviation * 100)}% below average`,
          recommendation: 'Consider restocking to prevent out-of-stock situations',
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect movement pattern anomalies
   */
  private async detectMovementAnomalies(customerId?: string, days: number = 7): Promise<any[]> {
    const anomalies: any[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get picking frequency by SKU
    const query = this.pickingRepository
      .createQueryBuilder('pick')
      .innerJoin('pick.inventoryItem', 'item')
      .select('item.sku', 'sku')
      .addSelect('COUNT(*)', 'picks')
      .groupBy('item.sku')
      .andWhere('pick.pickedAt >= :date', { date: cutoffDate });

    if (customerId) {
      query.andWhere('item.customerId = :customerId', { customerId });
    }

    const movementData = await query.getRawMany();

    if (movementData.length === 0) return anomalies;

    const avgPicks = movementData.reduce((sum, d) => sum + parseInt(d.picks), 0) / movementData.length;

    // Find SKUs with unusual movement patterns
    for (const data of movementData) {
      const picks = parseInt(data.picks);
      const deviation = (picks - avgPicks) / avgPicks;

      if (deviation > 2 && picks > avgPicks * 3) {
        anomalies.push({
          type: 'unusual_high_movement',
          severity: 'medium',
          sku: data.sku,
          picks,
          averagePicks: Math.round(avgPicks),
          deviation: Math.round(deviation * 100),
          message: `SKU ${data.sku} shows unusually high picking activity (${picks} picks)`,
          recommendation: 'Verify if this is expected demand or potential error',
        });
      } else if (picks === 0 && avgPicks > 5) {
        anomalies.push({
          type: 'stale_inventory',
          severity: 'low',
          sku: data.sku,
          picks: 0,
          averagePicks: Math.round(avgPicks),
          message: `SKU ${data.sku} has no picking activity despite being in a high-movement category`,
          recommendation: 'Review inventory placement and consider promotional activity',
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect location-related anomalies
   */
  private async detectLocationAnomalies(customerId?: string, days: number = 7): Promise<any[]> {
    const anomalies: any[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Find items without locations
    const itemsWithoutLocation = this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.locationId IS NULL')
      .andWhere('item.createdAt >= :date', { date: cutoffDate });

    if (customerId) {
      itemsWithoutLocation.andWhere('item.customerId = :customerId', { customerId });
    }

    const unlocatedCount = await itemsWithoutLocation.getCount();

    if (unlocatedCount > 0) {
      anomalies.push({
        type: 'missing_location',
        severity: 'high',
        count: unlocatedCount,
        message: `${unlocatedCount} inventory items are missing location assignments`,
        recommendation: 'Assign warehouse locations to ensure proper tracking',
      });
    }

    // Find locations with unusually high item density
    const locationDensity = this.inventoryRepository
      .createQueryBuilder('item')
      .select('item.locationId', 'locationId')
      .addSelect('COUNT(*)', 'itemCount')
      .where('item.locationId IS NOT NULL')
      .groupBy('item.locationId');

    if (customerId) {
      locationDensity.andWhere('item.customerId = :customerId', { customerId });
    }

    const densities = await locationDensity.getRawMany();

    if (densities.length > 0) {
      const avgDensity = densities.reduce((sum, d) => sum + parseInt(d.itemCount), 0) / densities.length;

      for (const density of densities) {
        const count = parseInt(density.itemCount);
        if (count > avgDensity * 2 && count > 50) {
          anomalies.push({
            type: 'location_overcrowding',
            severity: 'medium',
            locationId: density.locationId,
            itemCount: count,
            averageDensity: Math.round(avgDensity),
            message: `Location ${density.locationId} contains ${count} items, exceeding normal density`,
            recommendation: 'Consider redistributing items to other locations',
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect SKU-specific anomalies
   */
  private async detectSKUAnomalies(customerId?: string, days: number = 7): Promise<any[]> {
    const anomalies: any[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Find SKUs with missing critical attributes
    const itemsWithMissingData = this.inventoryRepository
      .createQueryBuilder('item')
      .where('(item.size IS NULL OR item.size = \'\')')
      .orWhere('(item.color IS NULL OR item.color = \'\')')
      .andWhere('item.createdAt >= :date', { date: cutoffDate });

    if (customerId) {
      itemsWithMissingData.andWhere('item.customerId = :customerId', { customerId });
    }

    const missingDataCount = await itemsWithMissingData.getCount();

    if (missingDataCount > 0) {
      anomalies.push({
        type: 'incomplete_item_data',
        severity: 'medium',
        count: missingDataCount,
        message: `${missingDataCount} items are missing size or color information`,
        recommendation: 'Complete item data to ensure accurate inventory management',
      });
    }

    return anomalies;
  }

  /**
   * Get anomaly summary dashboard data
   */
  async getAnomalySummary(customerId?: string): Promise<any> {
    const last7Days = await this.detectAnomalies(customerId, 7);
    const last30Days = await this.detectAnomalies(customerId, 30);

    return {
      period: {
        last7Days: {
          total: last7Days.totalAnomalies,
          bySeverity: last7Days.bySeverity,
        },
        last30Days: {
          total: last30Days.totalAnomalies,
          bySeverity: last30Days.bySeverity,
        },
      },
      trends: {
        criticalChange: last7Days.bySeverity.critical - (last30Days.bySeverity.critical / 30) * 7,
        highChange: last7Days.bySeverity.high - (last30Days.bySeverity.high / 30) * 7,
      },
      topAnomalies: last7Days.anomalies.slice(0, 10),
    };
  }
}