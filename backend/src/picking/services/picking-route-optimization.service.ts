import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderQueue } from '../entities/order-queue.entity';
import { PickingItem } from '../entities/picking-item.entity';
import { WarehouseLocation } from '../../warehouse/entities/warehouse-location.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

export interface LocationPoint {
  locationId: string;
  locationCode: string;
  area: string;
  column: string;
  rack: string;
  bin: string;
  x?: number; // Calculated coordinate
  y?: number; // Calculated coordinate
}

export interface OptimizedRoute {
  route: LocationPoint[];
  sequence: number[]; // Sequence of locations to visit
  totalDistance: number; // Total distance in units
  estimatedTime: number; // Estimated time in minutes
  pickingItems: PickingItemInfo[];
  startLocation?: LocationPoint;
  endLocation?: LocationPoint;
}

export interface PickingItemInfo {
  pickingItemId: string;
  inventoryItemId: string;
  sku: string;
  size: string;
  color: string;
  locationCode: string;
  sequence: number;
}

/**
 * Picking Route Optimization Service
 * Optimizes picking routes using shortest path algorithms (Nearest Neighbor / TSP approximation)
 */
@Injectable()
export class PickingRouteOptimizationService {
  constructor(
    @InjectRepository(OrderQueue)
    private orderQueueRepository: Repository<OrderQueue>,
    @InjectRepository(PickingItem)
    private pickingItemRepository: Repository<PickingItem>,
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
  ) {}

  /**
   * Generate optimized picking route for order queue
   */
  async optimizeRouteForOrderQueue(orderQueueId: string): Promise<OptimizedRoute> {
    const orderQueue = await this.orderQueueRepository.findOne({
      where: { id: orderQueueId },
      relations: ['pickingItems', 'pickingItems.inventoryItem'],
    });

    if (!orderQueue) {
      throw new Error(`Order queue ${orderQueueId} not found`);
    }

    // Get all picking items with their locations
    const pickingItems = orderQueue.pickingItems.filter((item) => !item.pickedAt);
    const locations = await this.extractLocations(pickingItems);

    if (locations.length === 0) {
      return {
        route: [],
        sequence: [],
        totalDistance: 0,
        estimatedTime: 0,
        pickingItems: [],
      };
    }

    // Calculate coordinates for each location
    const locationPoints = await this.calculateCoordinates(locations);

    // Optimize route using nearest neighbor algorithm
    const optimizedSequence = this.nearestNeighborAlgorithm(locationPoints);

    // Build the optimized route
    const route = optimizedSequence.map((index) => locationPoints[index]);
    const totalDistance = this.calculateTotalDistance(route);
    const estimatedTime = this.estimatePickingTime(route.length, totalDistance);

    // Map picking items to route sequence
    const pickingItemsInfo = this.mapPickingItemsToRoute(
      pickingItems,
      route,
      optimizedSequence,
    );

    return {
      route,
      sequence: optimizedSequence,
      totalDistance,
      estimatedTime,
      pickingItems: pickingItemsInfo,
      startLocation: route[0],
      endLocation: route[route.length - 1],
    };
  }

  /**
   * Generate optimized route for multiple order queues
   */
  async optimizeRouteForMultipleOrders(orderQueueIds: string[]): Promise<OptimizedRoute> {
    const orderQueues = await this.orderQueueRepository.find({
      where: orderQueueIds.map((id) => ({ id })),
      relations: ['pickingItems', 'pickingItems.inventoryItem'],
    });

    // Collect all picking items
    const allPickingItems: PickingItem[] = [];
    for (const queue of orderQueues) {
      const unpickedItems = queue.pickingItems.filter((item) => !item.pickedAt);
      allPickingItems.push(...unpickedItems);
    }

    if (allPickingItems.length === 0) {
      return {
        route: [],
        sequence: [],
        totalDistance: 0,
        estimatedTime: 0,
        pickingItems: [],
      };
    }

    const locations = await this.extractLocations(allPickingItems);
    const locationPoints = await this.calculateCoordinates(locations);
    const optimizedSequence = this.nearestNeighborAlgorithm(locationPoints);
    const route = optimizedSequence.map((index) => locationPoints[index]);
    const totalDistance = this.calculateTotalDistance(route);
    const estimatedTime = this.estimatePickingTime(route.length, totalDistance);

    const pickingItemsInfo = this.mapPickingItemsToRoute(
      allPickingItems,
      route,
      optimizedSequence,
    );

    return {
      route,
      sequence: optimizedSequence,
      totalDistance,
      estimatedTime,
      pickingItems: pickingItemsInfo,
      startLocation: route[0],
      endLocation: route[route.length - 1],
    };
  }

  /**
   * Extract unique locations from picking items
   */
  private async extractLocations(pickingItems: PickingItem[]): Promise<WarehouseLocation[]> {
    const locationIds = new Set<string>();

    for (const item of pickingItems) {
      if (item.inventoryItem?.locationId) {
        locationIds.add(item.inventoryItem.locationId);
      }
    }

    if (locationIds.size === 0) {
      return [];
    }

    return this.locationRepository.find({
      where: Array.from(locationIds).map((id) => ({ id })),
    });
  }

  /**
   * Calculate coordinates for locations based on BRAC structure
   */
  private async calculateCoordinates(
    locations: WarehouseLocation[],
  ): Promise<LocationPoint[]> {
    const locationPoints: LocationPoint[] = [];

    for (const location of locations) {
      // Calculate X coordinate (area + column)
      // Area A = 0-100, Area B = 100-200, etc.
      const areaMultiplier = location.area.charCodeAt(0) - 'A'.charCodeAt(0);
      const columnNum = parseInt(location.column) || 0;
      const x = areaMultiplier * 100 + columnNum * 10;

      // Calculate Y coordinate (rack + bin)
      const rackNum = parseInt(location.rack) || 0;
      const binNum = parseInt(location.bin) || 0;
      const y = rackNum * 10 + binNum;

      locationPoints.push({
        locationId: location.id,
        locationCode: location.locationCode,
        area: location.area,
        column: location.column,
        rack: location.rack,
        bin: location.bin,
        x,
        y,
      });
    }

    return locationPoints;
  }

  /**
   * Nearest Neighbor Algorithm for route optimization
   * Simple but effective TSP approximation
   */
  private nearestNeighborAlgorithm(locations: LocationPoint[]): number[] {
    if (locations.length === 0) return [];
    if (locations.length === 1) return [0];

    const visited = new Set<number>();
    const sequence: number[] = [];
    let currentIndex = 0;

    // Start from first location
    sequence.push(currentIndex);
    visited.add(currentIndex);

    // Find nearest unvisited location at each step
    while (visited.size < locations.length) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      for (let i = 0; i < locations.length; i++) {
        if (!visited.has(i)) {
          const distance = this.calculateDistance(
            locations[currentIndex],
            locations[i],
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }

      if (nearestIndex !== -1) {
        sequence.push(nearestIndex);
        visited.add(nearestIndex);
        currentIndex = nearestIndex;
      }
    }

    return sequence;
  }

  /**
   * Calculate Euclidean distance between two locations
   */
  private calculateDistance(
    location1: LocationPoint,
    location2: LocationPoint,
  ): number {
    if (!location1.x || !location1.y || !location2.x || !location2.y) {
      // Fallback: calculate based on BRAC structure differences
      return this.calculateBRACDistance(location1, location2);
    }

    const dx = location1.x - location2.x;
    const dy = location1.y - location2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate distance based on BRAC structure
   */
  private calculateBRACDistance(
    location1: LocationPoint,
    location2: LocationPoint,
  ): number {
    // Area difference (weight: 100)
    const areaDiff = Math.abs(
      location1.area.charCodeAt(0) - location2.area.charCodeAt(0),
    );

    // Column difference (weight: 10)
    const column1 = parseInt(location1.column) || 0;
    const column2 = parseInt(location2.column) || 0;
    const columnDiff = Math.abs(column1 - column2);

    // Rack difference (weight: 10)
    const rack1 = parseInt(location1.rack) || 0;
    const rack2 = parseInt(location2.rack) || 0;
    const rackDiff = Math.abs(rack1 - rack2);

    // Bin difference (weight: 1)
    const bin1 = parseInt(location1.bin) || 0;
    const bin2 = parseInt(location2.bin) || 0;
    const binDiff = Math.abs(bin1 - bin2);

    return areaDiff * 100 + columnDiff * 10 + rackDiff * 10 + binDiff;
  }

  /**
   * Calculate total distance of route
   */
  private calculateTotalDistance(route: LocationPoint[]): number {
    if (route.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += this.calculateDistance(route[i], route[i + 1]);
    }

    return Math.round(total * 100) / 100; // Round to 2 decimals
  }

  /**
   * Estimate picking time based on number of locations and distance
   */
  private estimatePickingTime(numLocations: number, totalDistance: number): number {
    // Average time per location: 2 minutes (walking + picking)
    // Average walking speed: 1 unit per 0.1 minutes
    const timePerLocation = 2;
    const walkingTime = totalDistance * 0.1;

    return Math.round((numLocations * timePerLocation + walkingTime) * 100) / 100;
  }

  /**
   * Map picking items to route sequence
   */
  private mapPickingItemsToRoute(
    pickingItems: PickingItem[],
    route: LocationPoint[],
    sequence: number[],
  ): PickingItemInfo[] {
    const itemsInfo: PickingItemInfo[] = [];

    for (let i = 0; i < route.length; i++) {
      const location = route[i];
      const locationItems = pickingItems.filter(
        (item) => item.inventoryItem?.locationId === location.locationId,
      );

      for (const item of locationItems) {
        itemsInfo.push({
          pickingItemId: item.id,
          inventoryItemId: item.inventoryItemId,
          sku: item.inventoryItem?.sku || '',
          size: item.inventoryItem?.size || '',
          color: item.inventoryItem?.color || '',
          locationCode: location.locationCode,
          sequence: i + 1,
        });
      }
    }

    return itemsInfo;
  }

  /**
   * Get route visualization data (for map rendering)
   */
  async getRouteVisualization(orderQueueId: string): Promise<any> {
    const route = await this.optimizeRouteForOrderQueue(orderQueueId);

    return {
      orderQueueId,
      route: {
        waypoints: route.route.map((point, index) => ({
          sequence: index + 1,
          locationCode: point.locationCode,
          area: point.area,
          column: point.column,
          rack: point.rack,
          bin: point.bin,
          coordinates: point.x && point.y ? { x: point.x, y: point.y } : null,
        })),
        path: route.sequence,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
      },
      items: route.pickingItems,
      summary: {
        totalLocations: route.route.length,
        totalItems: route.pickingItems.length,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        startLocation: route.startLocation?.locationCode,
        endLocation: route.endLocation?.locationCode,
      },
    };
  }

  /**
   * Get optimized route for multiple order queues (batch picking)
   */
  async getBatchRouteVisualization(orderQueueIds: string[]): Promise<any> {
    const route = await this.optimizeRouteForMultipleOrders(orderQueueIds);

    return {
      orderQueueIds,
      route: {
        waypoints: route.route.map((point, index) => ({
          sequence: index + 1,
          locationCode: point.locationCode,
          area: point.area,
          column: point.column,
          rack: point.rack,
          bin: point.bin,
          coordinates: point.x && point.y ? { x: point.x, y: point.y } : null,
        })),
        path: route.sequence,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
      },
      items: route.pickingItems,
      summary: {
        totalLocations: route.route.length,
        totalItems: route.pickingItems.length,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        startLocation: route.startLocation?.locationCode,
        endLocation: route.endLocation?.locationCode,
      },
    };
  }
}
