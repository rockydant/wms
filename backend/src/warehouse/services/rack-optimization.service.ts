import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

interface OptimalPlacement {
  locationId: string;
  locationCode: string;
  score: number;
  reason: string;
}

@Injectable()
export class RackOptimizationService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
  ) {}

  /**
   * Find optimal rack placement for an item based on movement frequency
   */
  async findOptimalPlacement(
    warehouseId: string,
    sku: string,
  ): Promise<OptimalPlacement[]> {
    // Get all available locations in the warehouse
    const locations = await this.locationRepository.find({
      where: { warehouseId },
      relations: ['items'],
    });

    // Calculate movement frequency for this SKU
    const skuMovementCount = await this.calculateSKUMovementFrequency(sku, warehouseId);

    // Score each location
    const scoredLocations: OptimalPlacement[] = [];

    for (const location of locations) {
      if (location.currentCapacity >= location.maxCapacity) {
        continue; // Skip full locations
      }

      let score = 0;
      let reason = '';

      // Factor 1: Available capacity (higher is better)
      const availableCapacity = location.maxCapacity - location.currentCapacity;
      score += availableCapacity * 10;

      // Factor 2: Low utilization (less busy areas)
      const utilizationScore = 100 - location.utilizationPercentage;
      score += utilizationScore * 2;

      // Factor 3: If SKU has high movement, prefer high-frequency areas
      if (skuMovementCount > 10) {
        // Prefer areas with high pick count (fast-moving items go to fast areas)
        score += location.pickCount * 5;
        reason = 'High-movement SKU matched to high-frequency area';
      } else {
        // Prefer areas with low activity (slow-moving items go to slow areas)
        score += (100 - location.pickCount) * 2;
        reason = 'Low-movement SKU matched to low-frequency area';
      }

      // Factor 4: Prefer locations that already have this SKU (consolidation)
      const existingSKUCount = location.items?.filter(
        (item) => item.sku === sku && item.status !== 'Shipped'
      ).length || 0;
      score += existingSKUCount * 50;
      if (existingSKUCount > 0) {
        reason = 'SKU consolidation - already has this SKU';
      }

      // Factor 5: Prefer recently used locations (efficiency)
      if (location.lastPlacedAt) {
        const daysSinceLastPlace = (Date.now() - location.lastPlacedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPlace < 7) {
          score += 20;
          reason = 'Recently used location';
        }
      }

      scoredLocations.push({
        locationId: location.id,
        locationCode: location.locationCode,
        score,
        reason: reason || 'General placement',
      });
    }

    // Sort by score descending
    return scoredLocations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate movement frequency for a SKU
   */
  private async calculateSKUMovementFrequency(
    sku: string,
    warehouseId: string,
  ): Promise<number> {
    // Get all inventory items for this SKU in this warehouse
    const items = await this.inventoryRepository
      .createQueryBuilder('item')
      .innerJoin('item.location', 'location')
      .where('item.sku = :sku', { sku })
      .andWhere('location.warehouseId = :warehouseId', { warehouseId })
      .getMany();

    // Count items that have been picked (indicating movement)
    const pickedCount = items.filter(
      (item) => item.status === 'Picked' || item.status === 'Shipped'
    ).length;

    return pickedCount;
  }

  /**
   * Get optimization recommendations for a warehouse
   */
  async getOptimizationRecommendations(warehouseId: string): Promise<any> {
    const locations = await this.locationRepository.find({
      where: { warehouseId },
      relations: ['items'],
    });

    const recommendations = {
      overUtilized: [],
      underUtilized: [],
      consolidation: [],
    };

    for (const location of locations) {
      // Over-utilized locations (>90% capacity)
      if (location.utilizationPercentage > 90) {
        recommendations.overUtilized.push({
          locationCode: location.locationCode,
          utilizationPercentage: location.utilizationPercentage,
          currentCapacity: location.currentCapacity,
          maxCapacity: location.maxCapacity,
          recommendation: 'Consider redistributing items to other locations',
        });
      }

      // Under-utilized locations (<20% capacity for more than 30 days)
      if (location.utilizationPercentage < 20 && location.items?.length > 0) {
        const oldestItem = location.items
          .map((item) => new Date(item.createdAt))
          .sort((a, b) => a.getTime() - b.getTime())[0];

        if (oldestItem) {
          const daysSinceOldestItem = (Date.now() - oldestItem.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceOldestItem > 30) {
            recommendations.underUtilized.push({
              locationCode: location.locationCode,
              utilizationPercentage: location.utilizationPercentage,
              daysSinceOldestItem: Math.floor(daysSinceOldestItem),
              recommendation: 'Consider consolidating items or moving to high-utilization area',
            });
          }
        }
      }

      // Consolidation opportunities (same SKU in multiple locations)
      const skuGroups = location.items?.reduce((acc, item) => {
        if (!acc[item.sku]) {
          acc[item.sku] = [];
        }
        acc[item.sku].push(item);
        return acc;
      }, {} as Record<string, any[]>) || {};

      Object.entries(skuGroups).forEach(([sku, items]) => {
        if (items.length > 5) {
          recommendations.consolidation.push({
            locationCode: location.locationCode,
            sku,
            itemCount: items.length,
            recommendation: `Consider consolidating ${items.length} items of SKU ${sku}`,
          });
        }
      });
    }

    return recommendations;
  }
}
