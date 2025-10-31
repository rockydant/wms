import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreightConfig, CarrierType, PricingModel } from '../entities/freight-config.entity';
import { CreateFreightConfigDto } from '../dto/create-freight-config.dto';
import { UpdateFreightConfigDto } from '../dto/update-freight-config.dto';
import { Shipment } from '../../shipments/entities/shipment.entity';

@Injectable()
export class FreightManagementService {
  constructor(
    @InjectRepository(FreightConfig)
    private freightConfigRepository: Repository<FreightConfig>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  async createConfig(createDto: CreateFreightConfigDto): Promise<FreightConfig> {
    const config = this.freightConfigRepository.create(createDto);
    return this.freightConfigRepository.save(config);
  }

  async getAllConfigs(): Promise<FreightConfig[]> {
    return this.freightConfigRepository.find({ order: { carrierType: 'ASC', name: 'ASC' } });
  }

  async getActiveConfigs(): Promise<FreightConfig[]> {
    return this.freightConfigRepository.find({ where: { isActive: true }, order: { carrierType: 'ASC', name: 'ASC' } });
  }

  async getConfigById(id: string): Promise<FreightConfig> {
    const config = await this.freightConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Freight configuration with ID ${id} not found`);
    }
    return config;
  }

  async getConfigsByCarrier(carrierType: string): Promise<FreightConfig[]> {
    return this.freightConfigRepository.find({ where: { carrierType: carrierType as CarrierType, isActive: true } });
  }

  async updateConfig(id: string, updateDto: UpdateFreightConfigDto): Promise<FreightConfig> {
    await this.freightConfigRepository.update(id, updateDto);
    return this.getConfigById(id);
  }

  async deleteConfig(id: string): Promise<void> {
    await this.freightConfigRepository.softDelete(id);
  }

  async toggleConfigStatus(id: string, isActive: boolean): Promise<FreightConfig> {
    const config = await this.getConfigById(id);
    config.isActive = isActive;
    return this.freightConfigRepository.save(config);
  }

  async calculateShippingCost(
    configId: string,
    weight: number,
    volume: number, // in cubic feet
    isWeekend: boolean = false,
  ): Promise<{ cost: number; config: FreightConfig }> {
    const config = await this.getConfigById(configId);
    if (!config.isActive) {
      throw new BadRequestException('Cannot calculate cost for inactive configuration');
    }

    let totalCost = config.baseRate || 0;

    if (config.pricingModel === PricingModel.WEIGHT_BASED) {
      totalCost += (weight * (config.ratePerUnit || 0));
    } else if (config.pricingModel === PricingModel.VOLUME_BASED) {
      totalCost += (volume * (config.ratePerUnit || 0));
    } else if (config.pricingModel === PricingModel.FLAT_RATE) {
      // Flat rate already covered by baseRate
    }

    if (isWeekend && config.weekendSurcharge) {
      totalCost += config.weekendSurcharge;
    }

    if (config.minCharge && totalCost < config.minCharge) {
      totalCost = config.minCharge;
    }
    if (config.maxCharge && totalCost > config.maxCharge) {
      totalCost = config.maxCharge;
    }

    return { cost: parseFloat(totalCost.toFixed(2)), config };
  }

  async getBestShippingOption(
    weight: number,
    volume: number,
    maxTransitDays?: number,
    requireWeekendDelivery: boolean = false,
  ): Promise<{ bestOption: FreightConfig; estimatedCost: number } | null> {
    const activeConfigs = await this.getActiveConfigs();
    let bestOption: FreightConfig | null = null;
    let minCost = Infinity;

    for (const config of activeConfigs) {
      if (requireWeekendDelivery && !config.supportsWeekendDelivery) {
        continue;
      }
      if (maxTransitDays && config.estimatedTransitDays && config.estimatedTransitDays > maxTransitDays) {
        continue;
      }

      try {
        const { cost } = await this.calculateShippingCost(config.id, weight, volume, requireWeekendDelivery);
        if (cost < minCost) {
          minCost = cost;
          bestOption = config;
        }
      } catch (error) {
        // Log error but continue to next config
        console.error(`Error calculating cost for config ${config.id}: ${error.message}`);
      }
    }

    if (bestOption) {
      return { bestOption, estimatedCost: minCost };
    }
    return null;
  }

  async getFreightStatistics(): Promise<any> {
    const totalConfigs = await this.freightConfigRepository.count();
    const activeConfigs = await this.freightConfigRepository.count({ where: { isActive: true } });
    const totalBookings = await this.shipmentRepository.count(); // Assuming each shipment has a booking

    const carrierBreakdown = await this.freightConfigRepository
      .createQueryBuilder('config')
      .select('config.carrierType', 'carrierType')
      .addSelect('COUNT(config.id)', 'count')
      .groupBy('config.carrierType')
      .getRawMany();

    return {
      totalConfigurations: totalConfigs,
      activeConfigurations: activeConfigs,
      totalBookings: totalBookings,
      carrierBreakdown,
      lastUpdated: new Date(),
    };
  }
}