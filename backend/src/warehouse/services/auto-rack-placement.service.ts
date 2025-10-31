import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { PickingItem } from '../../picking/entities/picking-item.entity';

// Import entities properly for TypeORM query builder

/**
 * Auto-Rack Placement Service
 * Automatically suggests optimal rack placement based on SKU movement frequency
 */
@Injectable()
export class AutoRackPlacementService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(PickingItem)
    private pickingRepository: Repository<PickingItem>,
  ) {}

  /**
   * Get optimal rack location for a SKU based on movement frequency
   */
  async getOptimalPlacement(
    warehouseId: string,
    sku: string,
    size?: string,
    color?: string,
  ): Promise<any> {
    // Calculate SKU movement frequency
    const movementFrequency = await this.calculateSKUMovementFrequency(sku, size, color);

    // Get available locations
    const availableLocations = await this.getAvailableLocations(warehouseId);

    // Score each location based on multiple factors
    const scoredLocations = await Promise.all(
      availableLocations.map(async (location) => {
        const score = await this.scoreLocation(location, movementFrequency);
        return {
          location,
          score: score.total,
          factors: score,
        };
      }),
    );

    // Sort by score (highest first)
    scoredLocations.sort((a, b) => b.score.total - a.score.total);

    const topRecommendations = scoredLocations.slice(0, 5);

    return {
      sku,
      size,
      color,
      movementFrequency: this.categorizeMovementFrequency(movementFrequency),
      recommendations: topRecommendations.map((rec) => ({
        locationCode: rec.location.locationCode,
        area: rec.location.area,
        column: rec.location.column,
        rack: rec.location.rack,
        bin: rec.location.bin,
        score: rec.score.total,
        factors: {
          distanceScore: rec.score.distanceScore,
          utilizationScore: rec.score.utilizationScore,
          movementScore: rec.score.movementScore,
          accessibilityScore: rec.score.accessibilityScore,
        },
        reasoning: this.generateReasoning(rec.score, movementFrequency),
      })),
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate movement frequency for a SKU
   */
  private async calculateSKUMovementFrequency(
    sku: string,
    size?: string,
    color?: string,
  ): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const query = this.pickingRepository
      .createQueryBuilder('pick')
      .innerJoin('pick.inventoryItem', 'item')
      .where('item.sku = :sku', { sku })
      .andWhere('pick.pickedAt >= :date', { date: sevenDaysAgo });

    if (size) {
      query.andWhere('item.size = :size', { size });
    }
    if (color) {
      query.andWhere('item.color = :color', { color });
    }

    const picks = await query.getCount();

    // Also consider incoming inventory (places)
    const placeQuery = this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.sku = :sku', { sku })
      .andWhere('item.createdAt >= :date', { date: sevenDaysAgo });

    if (size) {
      placeQuery.andWhere('item.size = :size', { size });
    }
    if (color) {
      placeQuery.andWhere('item.color = :color', { color });
    }

    const places = await placeQuery.getCount();

    return picks + places;
  }

  /**
   * Get available locations (not at capacity)
   */
  private async getAvailableLocations(warehouseId: string): Promise<WarehouseLocation[]> {
    return this.locationRepository.find({
      where: { warehouseId },
    });
  }

  /**
   * Score a location based on multiple factors
   */
  private async scoreLocation(
    location: WarehouseLocation,
    movementFrequency: number,
  ): Promise<any> {
    const maxCapacity = location.maxCapacity || 100;
    const currentUtilization = location.utilizationCount || 0;
    const utilizationPercent = (currentUtilization / maxCapacity) * 100;

    // Factor 1: Distance score (lower is better, closer to entrance/exit)
    // Area A is closest (100), B is next (80), etc.
    const distanceScore = this.calculateDistanceScore(location.area);

    // Factor 2: Utilization score (50-70% is optimal)
    const utilizationScore = this.calculateUtilizationScore(utilizationPercent);

    // Factor 3: Movement frequency alignment
    // High-frequency SKUs should be in easily accessible locations
    const movementScore = this.calculateMovementScore(location, movementFrequency);

    // Factor 4: Accessibility score (column and rack position)
    const accessibilityScore = this.calculateAccessibilityScore(location);

    // Weighted total score
    const total =
      distanceScore * 0.25 +
      utilizationScore * 0.25 +
      movementScore * 0.3 +
      accessibilityScore * 0.2;

    return {
      distanceScore,
      utilizationScore,
      movementScore,
      accessibilityScore,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Calculate distance score based on area
   */
  private calculateDistanceScore(area: string): number {
    const areaMap: Record<string, number> = {
      A: 100,
      B: 80,
      C: 60,
      D: 40,
      E: 20,
    };
    return areaMap[area.toUpperCase()] || 50;
  }

  /**
   * Calculate utilization score (optimal at 50-70%)
   */
  private calculateUtilizationScore(utilizationPercent: number): number {
    if (utilizationPercent >= 50 && utilizationPercent <= 70) {
      return 100; // Optimal range
    } else if (utilizationPercent >= 40 && utilizationPercent < 50) {
      return 80; // Good, slightly underutilized
    } else if (utilizationPercent > 70 && utilizationPercent <= 80) {
      return 70; // Getting full but still acceptable
    } else if (utilizationPercent >= 30 && utilizationPercent < 40) {
      return 60; // Underutilized
    } else if (utilizationPercent > 80 && utilizationPercent <= 90) {
      return 50; // Nearly full
    } else if (utilizationPercent < 30) {
      return 40; // Very underutilized
    } else {
      return 30; // Over capacity or nearly full
    }
  }

  /**
   * Calculate movement score (high-frequency SKUs in accessible locations)
   */
  private calculateMovementScore(location: WarehouseLocation, frequency: number): number {
    const frequencyCategory = this.categorizeMovementFrequency(frequency);

    // High-frequency items should be in easily accessible areas (Area A, lower columns/racks)
    if (frequencyCategory === 'high') {
      if (location.area === 'A' && parseInt(location.column) <= 3) {
        return 100;
      } else if (location.area === 'A') {
        return 80;
      } else if (location.area === 'B') {
        return 60;
      } else {
        return 40;
      }
    } else if (frequencyCategory === 'medium') {
      // Medium frequency: balance between accessibility and space
      if (location.area === 'A' || location.area === 'B') {
        return 70;
      } else {
        return 50;
      }
    } else {
      // Low frequency: can be in less accessible areas
      return 50;
    }
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(location: WarehouseLocation): number {
    // Lower column numbers and rack numbers are more accessible
    const columnNum = parseInt(location.column) || 5;
    const rackNum = parseInt(location.rack) || 5;

    const columnScore = Math.max(0, 100 - (columnNum - 1) * 10);
    const rackScore = Math.max(0, 100 - (rackNum - 1) * 10);

    return (columnScore + rackScore) / 2;
  }

  /**
   * Categorize movement frequency
   */
  private categorizeMovementFrequency(frequency: number): 'high' | 'medium' | 'low' {
    if (frequency >= 20) return 'high';
    if (frequency >= 5) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable reasoning for placement recommendation
   */
  private generateReasoning(score: any, movementFrequency: number): string {
    const reasons: string[] = [];

    if (score.distanceScore >= 80) {
      reasons.push('Close to warehouse entrance for easy access');
    }

    if (score.utilizationScore >= 80) {
      reasons.push('Optimal utilization level (50-70%)');
    } else if (score.utilizationScore < 60) {
      reasons.push('Available space for inventory placement');
    }

    const category = this.categorizeMovementFrequency(movementFrequency);
    if (category === 'high' && score.movementScore >= 80) {
      reasons.push('High-frequency SKU placed in accessible location');
    } else if (category === 'low' && score.movementScore <= 60) {
      reasons.push('Low-frequency SKU can utilize less accessible storage');
    }

    if (score.accessibilityScore >= 80) {
      reasons.push('Easy to reach (low column/rack numbers)');
    }

    return reasons.join('. ') || 'Standard warehouse location';
  }

  /**
   * Auto-place SKU in optimal location
   */
  async autoPlaceSKU(
    warehouseId: string,
    inventoryItemId: string,
    sku: string,
    size?: string,
    color?: string,
  ): Promise<any> {
    const recommendations = await this.getOptimalPlacement(warehouseId, sku, size, color);

    if (recommendations.recommendations.length === 0) {
      throw new Error('No suitable locations found');
    }

    const bestLocation = recommendations.recommendations[0];

    // Update inventory item location
    const inventoryItem = await this.inventoryRepository.findOne({
      where: { id: inventoryItemId },
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    const location = await this.locationRepository.findOne({
      where: { locationCode: bestLocation.locationCode },
    });

    if (!location) {
      throw new Error('Location not found');
    }

    // Update inventory item location
    inventoryItem.locationId = location.id;
    await this.inventoryRepository.save(inventoryItem);

    // Update location utilization
    location.utilizationCount = (location.utilizationCount || 0) + 1;
    await this.locationRepository.save(location);

    return {
      inventoryItemId,
      placedAt: bestLocation.locationCode,
      recommendation: bestLocation,
      placementReason: bestLocation.reasoning,
    };
  }
}
