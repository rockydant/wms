import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';

@Injectable()
export class WarehouseCrudService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(createDto: CreateWarehouseDto): Promise<Warehouse> {
    // Generate warehouse code if not provided
    const code = createDto.code || `WH-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const warehouse = this.warehouseRepository.create({
      ...createDto,
      code,
    });

    return this.warehouseRepository.save(warehouse);
  }

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      relations: ['locations', 'shipments', 'purchaseOrders'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['locations', 'shipments', 'purchaseOrders'],
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    return this.warehouseRepository.findOne({
      where: { code },
      relations: ['locations'],
    });
  }

  async update(id: string, updateDto: UpdateWarehouseDto): Promise<Warehouse> {
    await this.warehouseRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.warehouseRepository.softDelete(id);
  }

  async updateLocationCounts(id: string): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    
    const locationCount = warehouse.locations?.length || 0;
    const utilizedCount = warehouse.locations?.filter(
      (loc) => loc.currentCapacity > 0
    ).length || 0;

    warehouse.totalLocations = locationCount;
    warehouse.utilizedLocations = utilizedCount;

    return this.warehouseRepository.save(warehouse);
  }
}
