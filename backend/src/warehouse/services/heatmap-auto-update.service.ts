import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseLocation } from '../entities/warehouse-location.entity';

@Injectable()
export class HeatmapAutoUpdateService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Auto-update heatmap when an item is picked from a location
   */
  async updateOnPick(locationId: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
      relations: ['items'],
    });

    if (!location) {
      return;
    }

    // Update pick count and utilization
    location.pickCount += 1;
    location.utilizationCount = location.pickCount + location.placeCount;
    location.lastPickedAt = new Date();
    
    // Update current capacity based on items
    location.currentCapacity = location.items?.filter(
      (item) => item.status !== 'Shipped'
    ).length || 0;

    // Update utilization percentage
    if (location.maxCapacity > 0) {
      location.utilizationPercentage = (location.currentCapacity / location.maxCapacity) * 100;
    }

    await this.locationRepository.save(location);
  }

  /**
   * Auto-update heatmap when an item is placed in a location
   */
  async updateOnPlace(locationId: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
      relations: ['items'],
    });

    if (!location) {
      return;
    }

    // Update place count and utilization
    location.placeCount += 1;
    location.utilizationCount = location.pickCount + location.placeCount;
    location.lastPlacedAt = new Date();
    
    // Update current capacity based on items
    location.currentCapacity = location.items?.filter(
      (item) => item.status !== 'Shipped'
    ).length || 0;

    // Update utilization percentage
    if (location.maxCapacity > 0) {
      location.utilizationPercentage = (location.currentCapacity / location.maxCapacity) * 100;
    }

    await this.locationRepository.save(location);
  }

  /**
   * Auto-update all locations in a warehouse
   */
  async updateWarehouseHeatmap(warehouseId: string): Promise<void> {
    const locations = await this.locationRepository.find({
      where: { warehouseId },
      relations: ['items'],
    });

    for (const location of locations) {
      // Recalculate metrics
      location.currentCapacity = location.items?.filter(
        (item) => item.status !== 'Shipped'
      ).length || 0;

      location.utilizationCount = location.pickCount + location.placeCount;

      if (location.maxCapacity > 0) {
        location.utilizationPercentage = (location.currentCapacity / location.maxCapacity) * 100;
      }

      await this.locationRepository.save(location);
    }
  }
}
