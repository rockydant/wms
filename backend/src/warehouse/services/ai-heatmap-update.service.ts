import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { PickingItem } from '../../picking/entities/picking-item.entity';
import { PredictiveHeatmapService } from './predictive-heatmap.service';

/**
 * AI-Powered Heatmap Auto-Update Service
 * Uses machine learning predictions to automatically update heatmaps
 */
@Injectable()
export class AIHeatmapUpdateService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(PickingItem)
    private pickingRepository: Repository<PickingItem>,
    private predictiveHeatmapService: PredictiveHeatmapService,
  ) {}

  /**
   * Auto-update heatmap using AI predictions
   */
  async autoUpdateHeatmapWithAI(warehouseId: string): Promise<any> {
    // Get predictive heatmap
    const predictions = await this.predictiveHeatmapService.generatePredictiveHeatmap(
      warehouseId,
      7,
    );

    // Update locations based on predictions
    const updates = [];
    for (const prediction of predictions.predictions) {
      const location = await this.locationRepository.findOne({
        where: { id: prediction.locationId },
      });

      if (location) {
        // Update utilization based on prediction
        const predictedUtilization = prediction.predictedUtilization;

        // Adjust capacity if prediction shows overutilization
        if (predictedUtilization > 90 && prediction.confidence > 70) {
          // AI suggests increasing capacity or redistributing
          updates.push({
            locationId: location.id,
            locationCode: location.locationCode,
            currentUtilization: location.utilizationCount,
            predictedUtilization,
            recommendation: 'AI suggests redistributing inventory to prevent overutilization',
            action: 'increase_capacity_or_redistribute',
          });
        } else if (predictedUtilization < 20 && prediction.confidence > 70) {
          // AI suggests consolidating low-utilization locations
          updates.push({
            locationId: location.id,
            locationCode: location.locationCode,
            currentUtilization: location.utilizationCount,
            predictedUtilization,
            recommendation: 'AI suggests consolidating with nearby locations',
            action: 'consolidate',
          });
        }

        // Update location with AI-suggested adjustments
        if (prediction.trend === 'increasing' && prediction.confidence > 80) {
          // Proactive capacity adjustment
          location.maxCapacity = Math.max(
            location.maxCapacity || 0,
            Math.round(predictedUtilization * 1.1), // 10% buffer
          );
          await this.locationRepository.save(location);
        }
      }
    }

    return {
      warehouseId,
      updatedAt: new Date(),
      totalLocations: predictions.predictions.length,
      aiRecommendations: updates.length,
      updates,
      summary: {
        overutilizedLocations: updates.filter((u) => u.action === 'increase_capacity_or_redistribute').length,
        underutilizedLocations: updates.filter((u) => u.action === 'consolidate').length,
      },
    };
  }

  /**
   * Schedule automatic AI updates for warehouse
   */
  async scheduleAutoUpdate(warehouseId: string, intervalHours: number = 24): Promise<any> {
    // In a real implementation, this would use a scheduler (e.g., BullMQ, cron)
    // For now, return schedule configuration
    return {
      warehouseId,
      intervalHours,
      nextUpdate: new Date(Date.now() + intervalHours * 60 * 60 * 1000),
      status: 'scheduled',
    };
  }

  /**
   * Get AI recommendations for warehouse optimization
   */
  async getAIRecommendations(warehouseId: string): Promise<any> {
    const aiUpdate = await this.autoUpdateHeatmapWithAI(warehouseId);
    const predictions = await this.predictiveHeatmapService.generatePredictiveHeatmap(
      warehouseId,
      7,
    );
    const recommendations = await this.predictiveHeatmapService.getOptimizationRecommendations(
      warehouseId,
    );

    return {
      warehouseId,
      generatedAt: new Date(),
      aiPredictions: {
        totalLocations: predictions.predictions.length,
        highConfidence: predictions.predictions.filter((p) => p.confidence > 80).length,
        trendingUp: predictions.predictions.filter((p) => p.trend === 'increasing').length,
        trendingDown: predictions.predictions.filter((p) => p.trend === 'decreasing').length,
      },
      recommendations: {
        ...recommendations,
        aiUpdates: aiUpdate.updates,
      },
      actions: this.generateActionableItems(aiUpdate, recommendations),
    };
  }

  /**
   * Generate actionable items from AI recommendations
   */
  private generateActionableItems(aiUpdate: any, recommendations: any): any[] {
    const actions: any[] = [];

    // High-priority actions from AI updates
    for (const update of aiUpdate.updates) {
      if (update.action === 'increase_capacity_or_redistribute') {
        actions.push({
          priority: 'high',
          type: 'redistribute_inventory',
          location: update.locationCode,
          reason: update.recommendation,
          estimatedImpact: 'Prevent overutilization',
        });
      } else if (update.action === 'consolidate') {
        actions.push({
          priority: 'medium',
          type: 'consolidate_locations',
          location: update.locationCode,
          reason: update.recommendation,
          estimatedImpact: 'Optimize space usage',
        });
      }
    }

    // Add recommendations from optimization service
    if (recommendations.recommendations) {
      for (const rec of recommendations.recommendations) {
        actions.push({
          priority: rec.severity,
          type: rec.type,
          locations: rec.locations,
          reason: rec.message,
          action: rec.action,
        });
      }
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
