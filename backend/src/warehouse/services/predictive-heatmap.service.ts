import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { PickingItem } from '../../picking/entities/picking-item.entity';

/**
 * Predictive Heatmap Service
 * Uses historical data and movement patterns to predict future utilization
 */
@Injectable()
export class PredictiveHeatmapService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(PickingItem)
    private pickingRepository: Repository<PickingItem>,
  ) {}

  /**
   * Generate predictive heatmap based on historical movement patterns
   */
  async generatePredictiveHeatmap(
    warehouseId: string,
    daysAhead: number = 7,
  ): Promise<any> {
    const locations = await this.locationRepository.find({
      where: { warehouseId },
    });

    const predictions = await Promise.all(
      locations.map(async (location) => {
        const prediction = await this.predictLocationUtilization(
          location.id,
          daysAhead,
        );
        return {
          locationId: location.id,
          locationCode: location.locationCode,
          area: location.area,
          column: location.column,
          rack: location.rack,
          bin: location.bin,
          currentUtilization: location.utilizationCount,
          predictedUtilization: prediction.utilization,
          confidence: prediction.confidence,
          trend: prediction.trend,
          factors: prediction.factors,
        };
      }),
    );

    return {
      warehouseId,
      generatedAt: new Date(),
      predictionPeriod: daysAhead,
      predictions,
    };
  }

  /**
   * Predict utilization for a specific location
   */
  private async predictLocationUtilization(
    locationId: string,
    daysAhead: number,
  ): Promise<any> {
    // Get historical data
    const historicalData = await this.getHistoricalData(locationId, 30); // Last 30 days

    // Calculate movement frequency
    const movementFrequency = await this.calculateMovementFrequency(locationId);

    // Predict based on trends
    const trend = this.calculateTrend(historicalData);
    const predictedUtilization = this.forecastUtilization(
      historicalData,
      trend,
      daysAhead,
    );

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(historicalData, movementFrequency);

    // Identify contributing factors
    const factors = this.identifyFactors(locationId, historicalData, movementFrequency);

    return {
      utilization: Math.max(0, Math.round(predictedUtilization)),
      confidence: Math.min(100, Math.round(confidence)),
      trend,
      factors,
    };
  }

  /**
   * Get historical utilization data
   */
  private async getHistoricalData(locationId: string, days: number): Promise<any[]> {
    // In a real implementation, this would query time-series data
    // For now, we'll use recent pick/place operations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    const recentPicks = await this.pickingRepository
      .createQueryBuilder('pick')
      .innerJoin('pick.inventoryItem', 'item')
      .where('item.locationId = :locationId', { locationId })
      .andWhere('pick.pickedAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    const recentPlaces = await this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.locationId = :locationId', { locationId })
      .andWhere('item.createdAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    // Simulate daily data points
    const dataPoints: any[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      dataPoints.push({
        date,
        picks: Math.round(recentPicks / days),
        places: Math.round(recentPlaces / days),
        utilization: Math.round((recentPlaces - recentPicks) / days),
      });
    }

    return dataPoints;
  }

  /**
   * Calculate movement frequency for a location
   */
  private async calculateMovementFrequency(locationId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const picks = await this.pickingRepository
      .createQueryBuilder('pick')
      .innerJoin('pick.inventoryItem', 'item')
      .where('item.locationId = :locationId', { locationId })
      .andWhere('pick.pickedAt >= :date', { date: sevenDaysAgo })
      .getCount();

    const places = await this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.locationId = :locationId', { locationId })
      .andWhere('item.createdAt >= :date', { date: sevenDaysAgo })
      .getCount();

    return picks + places; // Total movements in last 7 days
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(historicalData: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (historicalData.length < 2) return 'stable';

    const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
    const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.utilization, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.utilization, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Forecast utilization based on trend
   */
  private forecastUtilization(
    historicalData: any[],
    trend: string,
    daysAhead: number,
  ): number {
    if (historicalData.length === 0) return 0;

    const recentAvg = historicalData
      .slice(-7) // Last 7 days
      .reduce((sum, d) => sum + d.utilization, 0) / Math.min(7, historicalData.length);

    const trendMultiplier = {
      increasing: 1.15, // 15% increase per week
      decreasing: 0.85, // 15% decrease per week
      stable: 1.0,
    }[trend];

    const dailyChange = (trendMultiplier - 1) / 7; // Daily change rate
    const predictedChange = 1 + dailyChange * daysAhead;

    return recentAvg * predictedChange;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(historicalData: any[], movementFrequency: number): number {
    let confidence = 50; // Base confidence

    // More data points = higher confidence
    if (historicalData.length >= 21) confidence += 20;
    else if (historicalData.length >= 14) confidence += 10;
    else if (historicalData.length >= 7) confidence += 5;

    // More movement = higher confidence in patterns
    if (movementFrequency >= 50) confidence += 20;
    else if (movementFrequency >= 20) confidence += 10;
    else if (movementFrequency >= 5) confidence += 5;

    return Math.min(100, confidence);
  }

  /**
   * Identify contributing factors to prediction
   */
  private async identifyFactors(
    locationId: string,
    historicalData: any[],
    movementFrequency: number,
  ): Promise<string[]> {
    const factors: string[] = [];

    if (movementFrequency > 30) {
      factors.push('High movement frequency');
    }

    const recentUtilization = historicalData
      .slice(-7)
      .reduce((sum, d) => sum + d.utilization, 0) / Math.min(7, historicalData.length);

    if (recentUtilization > 80) {
      factors.push('Currently high utilization');
    } else if (recentUtilization < 20) {
      factors.push('Currently low utilization');
    }

    const trend = this.calculateTrend(historicalData);
    if (trend === 'increasing') {
      factors.push('Increasing utilization trend');
    } else if (trend === 'decreasing') {
      factors.push('Decreasing utilization trend');
    }

    return factors;
  }

  /**
   * Get predictive recommendations for warehouse optimization
   */
  async getOptimizationRecommendations(warehouseId: string): Promise<any> {
    const predictions = await this.generatePredictiveHeatmap(warehouseId, 7);

    const recommendations: any[] = [];

    // Identify overutilized locations
    const overutilized = predictions.predictions.filter(
      (p: any) => p.predictedUtilization > 90,
    );
    if (overutilized.length > 0) {
      recommendations.push({
        type: 'overutilization_warning',
        severity: 'high',
        message: `${overutilized.length} locations predicted to exceed 90% utilization`,
        locations: overutilized.map((p: any) => p.locationCode),
        action: 'Consider redistributing inventory to prevent overutilization',
      });
    }

    // Identify underutilized locations
    const underutilized = predictions.predictions.filter(
      (p: any) => p.predictedUtilization < 10 && p.currentUtilization < 10,
    );
    if (underutilized.length > 0) {
      recommendations.push({
        type: 'underutilization_opportunity',
        severity: 'medium',
        message: `${underutilized.length} locations with low predicted utilization`,
        locations: underutilized.map((p: any) => p.locationCode),
        action: 'Consider consolidating inventory to optimize space usage',
      });
    }

    // Identify trending locations
    const trendingUp = predictions.predictions.filter(
      (p: any) => p.trend === 'increasing' && p.confidence > 70,
    );
    if (trendingUp.length > 0) {
      recommendations.push({
        type: 'growth_opportunity',
        severity: 'low',
        message: `${trendingUp.length} locations showing increasing utilization trends`,
        locations: trendingUp.map((p: any) => p.locationCode),
        action: 'Monitor these locations for capacity planning',
      });
    }

    return {
      warehouseId,
      generatedAt: new Date(),
      recommendations,
      summary: {
        total: recommendations.length,
        high: recommendations.filter((r) => r.severity === 'high').length,
        medium: recommendations.filter((r) => r.severity === 'medium').length,
        low: recommendations.filter((r) => r.severity === 'low').length,
      },
    };
  }
}
