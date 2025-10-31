import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, POStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { HeatmapAutoUpdateService } from '../warehouse/services/heatmap-auto-update.service';
import { InventoryStatus } from '../inventory/entities/inventory-item.entity';

@Injectable()
export class ReceivingService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private poItemRepository: Repository<PurchaseOrderItem>,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
    private heatmapAutoUpdateService: HeatmapAutoUpdateService,
  ) {}

  async create(createPoDto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    // Verify customer exists
    await this.customersService.findOne(createPoDto.customerId);

    // Generate PO Number
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const po = this.poRepository.create({
      customerId: createPoDto.customerId,
      poNumber,
      status: POStatus.PENDING,
    });

    const savedPO = await this.poRepository.save(po);

    // Create PO items
    const items = createPoDto.items.map((item) =>
      this.poItemRepository.create({
        ...item,
        purchaseOrderId: savedPO.id,
      }),
    );

    await this.poItemRepository.save(items);

    return this.findOne(savedPO.id);
  }

  async findAll(): Promise<PurchaseOrder[]> {
    return this.poRepository.find({
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const po = await this.poRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }
    return po;
  }

  async receiveItem(poId: string, itemId: string, locationId?: string): Promise<void> {
    const po = await this.findOne(poId);
    const item = po.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`PO Item with ID ${itemId} not found`);
    }

    // Create inventory item
    const inventoryItem = await this.inventoryService.create({
      customerId: po.customerId,
      sku: item.sku,
      size: item.size,
      color: item.color,
      locationId,
    });

    // Update PO item
    item.inventoryItemId = inventoryItem.id;
    item.receivedQuantity += 1;

    // Update inventory status to Ready (this will auto-update heatmap)
    await this.inventoryService.updateStatus(inventoryItem.id, InventoryStatus.READY);

    await this.poRepository.save(po);
  }

  async completePO(poId: string, userId: string): Promise<PurchaseOrder> {
    const po = await this.findOne(poId);
    po.status = POStatus.COMPLETED;
    po.receivedBy = userId;
    po.receivedAt = new Date();
    return this.poRepository.save(po);
  }
}
