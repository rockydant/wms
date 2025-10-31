import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem, InventoryStatus } from './entities/inventory-item.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CustomersService } from '../customers/customers.service';
import { BarcodesService } from '../barcodes/barcodes.service';
import { HeatmapAutoUpdateService } from '../warehouse/services/heatmap-auto-update.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    private customersService: CustomersService,
    private barcodesService: BarcodesService,
    private heatmapAutoUpdateService: HeatmapAutoUpdateService,
  ) {}

  async create(createInventoryItemDto: CreateInventoryItemDto): Promise<InventoryItem> {
    // Verify customer exists
    await this.customersService.findOne(createInventoryItemDto.customerId);

    // Generate inventory barcode
    const inventoryBarcode = await this.barcodesService.generateInventoryBarcode(
      createInventoryItemDto.sku,
    );

    const item = this.inventoryRepository.create({
      ...createInventoryItemDto,
      inventoryBarcode,
      status: InventoryStatus.IN_TRANSIT,
    });

    return this.inventoryRepository.save(item);
  }

  async findAll(): Promise<InventoryItem[]> {
    return this.inventoryRepository.find({
      relations: ['customer', 'location'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: string): Promise<InventoryItem[]> {
    return this.inventoryRepository.find({
      where: { customerId },
      relations: ['customer', 'location'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['customer', 'location'],
    });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async findByBarcode(barcode: string): Promise<InventoryItem | null> {
    return this.inventoryRepository.findOne({
      where: { inventoryBarcode: barcode },
      relations: ['customer', 'location'],
    });
  }

  async update(id: string, updateInventoryItemDto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOne(id);
    const previousLocationId = item.locationId;

    await this.inventoryRepository.update(id, updateInventoryItemDto);
    const updatedItem = await this.findOne(id);

    // Auto-update heatmap if location changed
    if (updateInventoryItemDto.locationId && updateInventoryItemDto.locationId !== previousLocationId) {
      await this.heatmapAutoUpdateService.updateOnPlace(updateInventoryItemDto.locationId);
      if (previousLocationId) {
        await this.heatmapAutoUpdateService.updateOnPick(previousLocationId);
      }
    }

    return updatedItem;
  }

  async updateStatus(id: string, status: InventoryStatus): Promise<InventoryItem> {
    const item = await this.findOne(id);
    item.status = status;
    if (status === InventoryStatus.RECEIVED || status === InventoryStatus.READY) {
      item.receivedAt = new Date();

      // Auto-update heatmap when item is placed/received
      if (item.locationId) {
        await this.heatmapAutoUpdateService.updateOnPlace(item.locationId);
      }
    }
    return this.inventoryRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    await this.inventoryRepository.softDelete(id);
  }
}
