import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreightBooking } from '../entities/freight-booking.entity';
import { CreateFreightConfigDto } from '../dto/create-freight-config.dto';
import { UpdateFreightConfigDto } from '../dto/update-freight-config.dto';

/**
 * Freight Configuration Entity
 * Stores carrier configurations and rates
 */
export interface FreightConfig {
  id: string;
  carrierType: string;
  carrierName: string;
  serviceName: string;
  baseRate: number; // Base rate per shipment
  ratePerWeight: number; // Rate per pound/kg
  ratePerVolume: number; // Rate per cubic foot
  minCharge: number; // Minimum charge
  maxCharge?: number; // Maximum charge (optional)
  transitDays: number; // Estimated transit days
  isActive: boolean;
  supportsWeekendDelivery: boolean;
  weekendSurcharge?: number; // Additional charge for weekend delivery
  insuranceIncluded: boolean;
  trackingIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Freight Management Service
 * Manages freight carrier configurations, rates, and shipping rules
 */
@Injectable()
export class FreightManagementService {
  private freightConfigs: Map<string, FreightConfig> = new Map();

  constructor(
    @InjectRepository(FreightBooking)
    private freightBookingRepository: Repository<FreightBooking>,
  ) {
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default freight configurations
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs: FreightConfig[] = [
      {
        id: 'ups-ground',
        carrierType: 'UPS',
        carrierName: 'United Parcel Service',
        serviceName: 'UPS Ground',
        baseRate: 8.50,
        ratePerWeight: 0.85,
        ratePerVolume: 2.00,
        minCharge: 10.00,
        transitDays: 5,
        isActive: true,
        supportsWeekendDelivery: false,
        insuranceIncluded: false,
        trackingIncluded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ups-2day',
        carrierType: 'UPS',
        carrierName: 'United Parcel Service',
        serviceName: 'UPS 2nd Day Air',
        baseRate: 15.00,
        ratePerWeight: 1.50,
        ratePerVolume: 3.00,
        minCharge: 20.00,
        transitDays: 2,
        isActive: true,
        supportsWeekendDelivery: true,
        weekendSurcharge: 5.00,
        insuranceIncluded: false,
        trackingIncluded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'fedex-ground',
        carrierType: 'FedEx',
        carrierName: 'Federal Express',
        serviceName: 'FedEx Ground',
        baseRate: 9.00,
        ratePerWeight: 0.90,
        ratePerVolume: 2.20,
        minCharge: 11.00,
        transitDays: 4,
        isActive: true,
        supportsWeekendDelivery: false,
        insuranceIncluded: false,
        trackingIncluded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'usps-priority',
        carrierType: 'USPS',
        carrierName: 'United States Postal Service',
        serviceName: 'USPS Priority Mail',
        baseRate: 7.50,
        ratePerWeight: 0.75,
        ratePerVolume: 1.50,
        minCharge: 8.50,
        transitDays: 3,
        isActive: true,
        supportsWeekendDelivery: true,
        weekendSurcharge: 3.00,
        insuranceIncluded: true,
        trackingIncluded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultConfigs.forEach((config) => {
      this.freightConfigs.set(config.id, config);
    });
  }

  /**
   * Get all freight configurations
   */
  getAllConfigs(): FreightConfig[] {
    return Array.from(this.freightConfigs.values());
  }

  /**
   * Get active freight configurations
   */
  getActiveConfigs(): FreightConfig[] {
    return Array.from(this.freightConfigs.values()).filter((config) => config.isActive);
  }

  /**
   * Get freight configuration by ID
   */
  getConfigById(id: string): FreightConfig | undefined {
    return this.freightConfigs.get(id);
  }

  /**
   * Get freight configurations by carrier type
   */
  getConfigsByCarrier(carrierType: string): FreightConfig[] {
    return Array.from(this.freightConfigs.values()).filter(
      (config) => config.carrierType === carrierType && config.isActive,
    );
  }

  /**
   * Create new freight configuration
   */
  createConfig(createDto: CreateFreightConfigDto): FreightConfig {
    const config: FreightConfig = {
      id: createDto.id || `config-${Date.now()}`,
      ...createDto,
      isActive: createDto.isActive ?? true,
      insuranceIncluded: createDto.insuranceIncluded ?? false,
      trackingIncluded: createDto.trackingIncluded ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.freightConfigs.set(config.id, config);
    return config;
  }

  /**
   * Update freight configuration
   */
  updateConfig(id: string, updateDto: UpdateFreightConfigDto): FreightConfig {
    const existing = this.freightConfigs.get(id);
    if (!existing) {
      throw new Error(`Freight configuration with ID ${id} not found`);
    }

    const updated: FreightConfig = {
      ...existing,
      ...updateDto,
      updatedAt: new Date(),
    };

    this.freightConfigs.set(id, updated);
    return updated;
  }

  /**
   * Delete freight configuration
   */
  deleteConfig(id: string): void {
    if (!this.freightConfigs.has(id)) {
      throw new Error(`Freight configuration with ID ${id} not found`);
    }
    this.freightConfigs.delete(id);
  }

  /**
   * Calculate shipping cost based on configuration
   */
  calculateShippingCost(
    configId: string,
    weight: number,
    volume: number,
    isWeekend: boolean = false,
  ): number {
    const config = this.freightConfigs.get(configId);
    if (!config || !config.isActive) {
      throw new Error(`Active freight configuration with ID ${configId} not found`);
    }

    let cost = config.baseRate;
    cost += weight * config.ratePerWeight;
    cost += volume * config.ratePerVolume;

    // Apply weekend surcharge if applicable
    if (isWeekend && config.supportsWeekendDelivery && config.weekendSurcharge) {
      cost += config.weekendSurcharge;
    }

    // Apply min/max charges
    if (cost < config.minCharge) {
      cost = config.minCharge;
    }
    if (config.maxCharge && cost > config.maxCharge) {
      cost = config.maxCharge;
    }

    return Math.round(cost * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get best shipping option for given criteria
   */
  getBestShippingOption(
    weight: number,
    volume: number,
    maxTransitDays?: number,
    requireWeekendDelivery: boolean = false,
  ): FreightConfig | null {
    let configs = this.getActiveConfigs();

    // Filter by weekend delivery requirement
    if (requireWeekendDelivery) {
      configs = configs.filter((config) => config.supportsWeekendDelivery);
    }

    // Filter by transit days
    if (maxTransitDays) {
      configs = configs.filter((config) => config.transitDays <= maxTransitDays);
    }

    if (configs.length === 0) {
      return null;
    }

    // Find configuration with lowest cost
    let bestConfig = configs[0];
    let bestCost = this.calculateShippingCost(
      bestConfig.id,
      weight,
      volume,
      requireWeekendDelivery,
    );

    for (const config of configs) {
      const cost = this.calculateShippingCost(config.id, weight, volume, requireWeekendDelivery);
      if (cost < bestCost) {
        bestCost = cost;
        bestConfig = config;
      }
    }

    return bestConfig;
  }

  /**
   * Enable/disable freight configuration
   */
  toggleConfigStatus(id: string, isActive: boolean): FreightConfig {
    const config = this.freightConfigs.get(id);
    if (!config) {
      throw new Error(`Freight configuration with ID ${id} not found`);
    }

    config.isActive = isActive;
    config.updatedAt = new Date();
    this.freightConfigs.set(id, config);

    return config;
  }

  /**
   * Get freight statistics
   */
  async getFreightStatistics(): Promise<any> {
    const bookings = await this.freightBookingRepository.find();
    const configs = this.getAllConfigs();

    const stats = {
      totalBookings: bookings.length,
      totalConfigs: configs.length,
      activeConfigs: configs.filter((c) => c.isActive).length,
      carriers: {} as Record<string, number>,
    };

    // Count bookings by carrier
    bookings.forEach((booking) => {
      const carrier = booking.carrier || 'Unknown';
      stats.carriers[carrier] = (stats.carriers[carrier] || 0) + 1;
    });

    return stats;
  }
}
