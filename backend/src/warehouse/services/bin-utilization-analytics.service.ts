import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { Warehouse } from '../entities/warehouse.entity';

interface UtilizationMetrics {
  totalLocations: number;
  utilizedLocations: number;
  utilizationRate: number;
  averageUtilizationPercentage: number;
  overUtilized: number; // >90%
  underUtilized: number; // <20%
  optimalUtilized: number; // 20-90%
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
}

@Injectable()
export class BinUtilizationAnalyticsService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  /**
   * Get utilization analytics for a specific warehouse
   */
  async getWarehouseUtilizationMetrics(warehouseId: string): Promise<UtilizationMetrics> {
    const locations = await this.locationRepository.find({
      where: { warehouseId },
      relations: ['items'],
    });

    const totalLocations = locations.length;
    const utilizedLocations = locations.filter((loc) => loc.currentCapacity > 0).length;
    const utilizationRate = totalLocations > 0 ? (utilizedLocations / totalLocations) * 100 : 0;

    let totalUtilization = 0;
    let totalCapacity = 0;
    let usedCapacity = 0;
    let overUtilized = 0;
    let underUtilized = 0;
    let optimalUtilized = 0;

    for (const location of locations) {
      totalCapacity += location.maxCapacity;
      usedCapacity += location.currentCapacity;

      const utilization = location.utilizationPercentage || 0;
      totalUtilization += utilization;

      if (utilization > 90) {
        overUtilized++;
      } else if (utilization < 20) {
        underUtilized++;
      } else {
        optimalUtilized++;
      }
    }

    const averageUtilizationPercentage =
      totalLocations > 0 ? totalUtilization / totalLocations : 0;

    return {
      totalLocations,
      utilizedLocations,
      utilizationRate,
      averageUtilizationPercentage,
      overUtilized,
      underUtilized,
      optimalUtilized,
      totalCapacity,
      usedCapacity,
      availableCapacity: totalCapacity - usedCapacity,
    };
  }

  /**
   * Get utilization analytics for all warehouses
   */
  async getAllWarehousesUtilizationMetrics(): Promise<
    Array<{ warehouse: Warehouse; metrics: UtilizationMetrics }>
  > {
    const warehouses = await this.warehouseRepository.find({
      relations: ['locations', 'locations.items'],
    });

    const results = [];

    for (const warehouse of warehouses) {
      const metrics = await this.getWarehouseUtilizationMetrics(warehouse.id);
      results.push({ warehouse, metrics });
    }

    return results;
  }

  /**
   * Get utilization trends over time (last 30 days)
   */
  async getUtilizationTrends(warehouseId: string): Promise<any[]> {
    // This would typically query historical data
    // For now, we'll return current snapshot
    const metrics = await this.getWarehouseUtilizationMetrics(warehouseId);

    return [
      {
        date: new Date().toISOString().split('T')[0],
        utilizationRate: metrics.utilizationRate,
        averageUtilizationPercentage: metrics.averageUtilizationPercentage,
        usedCapacity: metrics.usedCapacity,
        totalCapacity: metrics.totalCapacity,
      },
    ];
  }

  /**
   * Get utilization by area (heatmap data)
   */
  async getUtilizationByArea(warehouseId: string): Promise<any> {
    const locations = await this.locationRepository.find({
      where: { warehouseId },
      relations: ['items'],
    });

    const areaMap = new Map<string, any>();

    for (const location of locations) {
      const area = location.area;
      if (!areaMap.has(area)) {
        areaMap.set(area, {
          area,
          totalLocations: 0,
          utilizedLocations: 0,
          totalCapacity: 0,
          usedCapacity: 0,
          averageUtilization: 0,
        });
      }

      const areaData = areaMap.get(area);
      areaData.totalLocations++;
      areaData.totalCapacity += location.maxCapacity;
      areaData.usedCapacity += location.currentCapacity;

      if (location.currentCapacity > 0) {
        areaData.utilizedLocations++;
      }
    }

    // Calculate averages
    for (const [area, data] of areaMap.entries()) {
      if (data.totalCapacity > 0) {
        data.averageUtilization = (data.usedCapacity / data.totalCapacity) * 100;
      }
    }

    return Array.from(areaMap.values());
  }

  /**
   * Get top underutilized locations
   */
  async getTopUnderutilizedLocations(
    warehouseId: string,
    limit: number = 10,
  ): Promise<WarehouseLocation[]> {
    return this.locationRepository.find({
      where: { warehouseId },
      relations: ['items'],
      order: { utilizationPercentage: 'ASC' },
      take: limit,
    });
  }

  /**
   * Get top overutilized locations
   */
  async getTopOverutilizedLocations(
    warehouseId: string,
    limit: number = 10,
  ): Promise<WarehouseLocation[]> {
    return this.locationRepository.find({
      where: { warehouseId },
      relations: ['items'],
      order: { utilizationPercentage: 'DESC' },
      take: limit,
    });
  }
}
