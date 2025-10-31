import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hub } from './entities/hub.entity';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';

/**
 * 3PL Hubs Service
 * Manages fulfillment hubs (3PL providers) that coordinate multiple warehouses and customers
 */
@Injectable()
export class HubsService {
  constructor(
    @InjectRepository(Hub)
    private hubRepository: Repository<Hub>,
  ) {}

  async create(createDto: CreateHubDto): Promise<Hub> {
    // Check if code already exists
    const existingHub = await this.hubRepository.findOne({
      where: { code: createDto.code },
    });
    if (existingHub) {
      throw new BadRequestException(`Hub with code ${createDto.code} already exists`);
    }

    const hub = this.hubRepository.create(createDto);
    return this.hubRepository.save(hub);
  }

  async findAll(): Promise<Hub[]> {
    return this.hubRepository.find({
      relations: ['warehouses', 'customers', 'tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Hub> {
    const hub = await this.hubRepository.findOne({
      where: { id },
      relations: ['warehouses', 'customers', 'tenant'],
    });
    if (!hub) {
      throw new NotFoundException(`Hub with ID ${id} not found`);
    }
    return hub;
  }

  async findByCode(code: string): Promise<Hub> {
    const hub = await this.hubRepository.findOne({
      where: { code },
      relations: ['warehouses', 'customers', 'tenant'],
    });
    if (!hub) {
      throw new NotFoundException(`Hub with code ${code} not found`);
    }
    return hub;
  }

  async update(id: string, updateDto: UpdateHubDto): Promise<Hub> {
    await this.hubRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.hubRepository.softDelete(id);
  }

  /**
   * Get hub statistics
   */
  async getHubStatistics(id: string): Promise<any> {
    const hub = await this.findOne(id);

    return {
      hubId: hub.id,
      hubName: hub.name,
      hubCode: hub.code,
      statistics: {
        totalWarehouses: hub.warehouses?.length || 0,
        totalCustomers: hub.customers?.length || 0,
        activeWarehouses: hub.warehouses?.filter((w) => w.isActive).length || 0,
        activeCustomers: hub.customers?.filter((c) => c.isActive).length || 0,
      },
    };
  }

  /**
   * Assign warehouse to hub
   */
  async assignWarehouse(hubId: string, warehouseId: string): Promise<void> {
    const hub = await this.findOne(hubId);
    // In a real implementation, this would update the warehouse's hubId
    // For now, this is a placeholder that would integrate with WarehouseService
  }

  /**
   * Assign customer to hub
   */
  async assignCustomer(hubId: string, customerId: string): Promise<void> {
    const hub = await this.findOne(hubId);
    // In a real implementation, this would update the customer's hubId
    // For now, this is a placeholder that would integrate with CustomersService
  }
}
