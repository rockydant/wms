import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseLocationDto } from './dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse-location.dto';
import { WarehouseCrudService } from './services/warehouse-crud.service';
import { HeatmapAutoUpdateService } from './services/heatmap-auto-update.service';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    private warehouseCrudService: WarehouseCrudService,
    private heatmapAutoUpdateService: HeatmapAutoUpdateService,
  ) {}

  async createLocation(createDto: CreateWarehouseLocationDto): Promise<WarehouseLocation> {
    // Verify warehouse exists
    const warehouse = await this.warehouseCrudService.findOne(createDto.warehouseId);
    
    // Generate location code with warehouse prefix
    const locationCode = `${warehouse.code}-${createDto.area}-${createDto.column}-${createDto.rack}-${createDto.bin}`;

    const location = this.locationRepository.create({
      ...createDto,
      locationCode,
    });

    const savedLocation = await this.locationRepository.save(location);
    
    // Update warehouse location counts
    await this.warehouseCrudService.updateLocationCounts(createDto.warehouseId);

    return savedLocation;
  }

  async findAllLocations(warehouseId?: string): Promise<WarehouseLocation[]> {
    const where = warehouseId ? { warehouseId } : {};
    return this.locationRepository.find({
      where,
      relations: ['items', 'warehouse'],
      order: { locationCode: 'ASC' },
    });
  }

  async findOne(id: string): Promise<WarehouseLocation> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!location) {
      throw new NotFoundException(`Warehouse location with ID ${id} not found`);
    }
    return location;
  }

  async findByCode(locationCode: string): Promise<WarehouseLocation | null> {
    return this.locationRepository.findOne({
      where: { locationCode },
      relations: ['items'],
    });
  }

  async update(
    id: string,
    updateDto: UpdateWarehouseLocationDto,
  ): Promise<WarehouseLocation> {
    await this.locationRepository.update(id, updateDto);
    const updated = await this.findOne(id);
    
    // Recalculate utilization if capacity changed
    if (updateDto.maxCapacity !== undefined || updateDto.currentCapacity !== undefined) {
      if (updated.maxCapacity > 0) {
        updated.utilizationPercentage = (updated.currentCapacity / updated.maxCapacity) * 100;
      }
      await this.locationRepository.save(updated);
    }
    
    return updated;
  }

  async updateUtilization(id: string): Promise<WarehouseLocation> {
    const location = await this.findOne(id);
    location.utilizationCount += 1;
    location.currentCapacity = location.items?.filter(
      (item) => item.status !== 'Shipped'
    ).length || 0;
    
    if (location.maxCapacity > 0) {
      location.utilizationPercentage = (location.currentCapacity / location.maxCapacity) * 100;
    }
    
    return this.locationRepository.save(location);
  }

  async getHeatmap(warehouseId?: string): Promise<WarehouseLocation[]> {
    const where = warehouseId ? { warehouseId } : {};
    return this.locationRepository.find({
      where,
      relations: ['items', 'warehouse'],
      order: { utilizationCount: 'DESC' },
    });
  }

  // Delegate warehouse CRUD operations
  async createWarehouse = this.warehouseCrudService.create.bind(this.warehouseCrudService);
  async findAllWarehouses = this.warehouseCrudService.findAll.bind(this.warehouseCrudService);
  async findOneWarehouse = this.warehouseCrudService.findOne.bind(this.warehouseCrudService);
  async updateWarehouse = this.warehouseCrudService.update.bind(this.warehouseCrudService);
  async removeWarehouse = this.warehouseCrudService.remove.bind(this.warehouseCrudService);

  // Heatmap auto-update methods
  async updateOnPick = this.heatmapAutoUpdateService.updateOnPick.bind(this.heatmapAutoUpdateService);
  async updateOnPlace = this.heatmapAutoUpdateService.updateOnPlace.bind(this.heatmapAutoUpdateService);
  async updateWarehouseHeatmap = this.heatmapAutoUpdateService.updateWarehouseHeatmap.bind(this.heatmapAutoUpdateService);

  async remove(id: string): Promise<void> {
    await this.locationRepository.softDelete(id);
  }
}
