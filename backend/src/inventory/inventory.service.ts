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

  async createBulk(createInventoryItemDto: CreateInventoryItemDto, quantity: number): Promise<InventoryItem[]> {
    // Verify customer exists
    await this.customersService.findOne(createInventoryItemDto.customerId);

    const items: InventoryItem[] = [];
    
    for (let i = 0; i < quantity; i++) {
      // Generate unique inventory barcode for each item
      const inventoryBarcode = await this.barcodesService.generateInventoryBarcode(
        createInventoryItemDto.sku,
      );

      const item = this.inventoryRepository.create({
        ...createInventoryItemDto,
        inventoryBarcode,
        status: InventoryStatus.IN_TRANSIT,
      });

      items.push(item);
    }

    return this.inventoryRepository.save(items);
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

  async getSummaryBySku(customerId?: string): Promise<any[]> {
    const query = this.inventoryRepository
      .createQueryBuilder('item')
      .select('item.sku', 'sku')
      .addSelect('item.size', 'size')
      .addSelect('item.color', 'color')
      .addSelect('item.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('item.sku')
      .addGroupBy('item.size')
      .addGroupBy('item.color')
      .addGroupBy('item.status');

    if (customerId) {
      query.where('item.customerId = :customerId', { customerId });
    }

    const results = await query.getRawMany();

    // Aggregate by SKU
    const skuMap = new Map<string, any>();

    for (const row of results) {
      const sku = row.sku;
      if (!skuMap.has(sku)) {
        skuMap.set(sku, {
          sku: row.sku,
          total: 0,
          byStatus: {},
          byVariant: [],
        });
      }

      const entry = skuMap.get(sku);
      const count = parseInt(row.count);
      entry.total += count;
      entry.byStatus[row.status] = (entry.byStatus[row.status] || 0) + count;

      // Track variant counts
      const variantKey = `${row.size}-${row.color}`;
      const existingVariant = entry.byVariant.find(v => v.key === variantKey);
      if (existingVariant) {
        existingVariant.count += count;
      } else {
        entry.byVariant.push({
          key: variantKey,
          size: row.size,
          color: row.color,
          count: count,
        });
      }
    }

    return Array.from(skuMap.values());
  }
}
