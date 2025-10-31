import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { CustomersService } from '../customers/customers.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebhookEvent } from '../webhooks/entities/webhook.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    @InjectRepository(ShipmentItem)
    private shipmentItemsRepository: Repository<ShipmentItem>,
    private customersService: CustomersService,
    private webhooksService: WebhooksService,
  ) {}

  async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    // Verify customer exists
    await this.customersService.findOne(createShipmentDto.customerId);

    // Calculate total quantity
    const totalQuantity = createShipmentDto.items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );

    const shipment = this.shipmentsRepository.create({
      customerId: createShipmentDto.customerId,
      warehouseId: createShipmentDto.warehouseId,
      status: ShipmentStatus.PENDING,
      totalQuantity,
      fulfilledQuantity: 0,
      fulfillmentPercentage: 0,
    });

    const savedShipment = await this.shipmentsRepository.save(shipment);

    // Create shipment items
    const items = createShipmentDto.items.map((item) =>
      this.shipmentItemsRepository.create({
        ...item,
        shipmentId: savedShipment.id,
      }),
    );

    await this.shipmentItemsRepository.save(items);

    const savedShipmentWithRelations = await this.findOne(savedShipment.id);

    // Trigger webhook for shipment created
    await this.webhooksService.triggerWebhook(
      savedShipmentWithRelations.customerId,
      WebhookEvent.SHIPMENT_CREATED,
      savedShipmentWithRelations,
    );

    return savedShipmentWithRelations;
  }

  async findAll(warehouseId?: string): Promise<Shipment[]> {
    const where = warehouseId ? { warehouseId } : {};
    return this.shipmentsRepository.find({
      where,
      relations: ['customer', 'warehouse', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: string, warehouseId?: string): Promise<Shipment[]> {
    const where: any = { customerId };
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }
    return this.shipmentsRepository.find({
      where,
      relations: ['customer', 'warehouse', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findOne({
      where: { id },
      relations: ['customer', 'warehouse', 'items'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return shipment;
  }

  async update(id: string, updateShipmentDto: UpdateShipmentDto): Promise<Shipment> {
    await this.shipmentsRepository.update(id, updateShipmentDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: ShipmentStatus): Promise<Shipment> {
    const shipment = await this.findOne(id);
    const previousStatus = shipment.status;
    shipment.status = status;
    if (status === ShipmentStatus.SHIPPED || status === ShipmentStatus.PARTIALLY_SHIPPED) {
      if (!shipment.shippedAt) {
        shipment.shippedAt = new Date();
      }
    }
    const updatedShipment = await this.shipmentsRepository.save(shipment);

    // Trigger webhook for status change
    if (previousStatus !== status) {
      let event: WebhookEvent = WebhookEvent.SHIPMENT_UPDATED;
      if (status === ShipmentStatus.SHIPPED) {
        event = WebhookEvent.SHIPMENT_SHIPPED;
      } else if (status === ShipmentStatus.PARTIALLY_SHIPPED) {
        event = WebhookEvent.SHIPMENT_PARTIALLY_SHIPPED;
      } else if (status === ShipmentStatus.READY) {
        event = WebhookEvent.SHIPMENT_READY;
      }

      await this.webhooksService.triggerWebhook(
        updatedShipment.customerId,
        event,
        updatedShipment,
      );
    }

    return updatedShipment;
  }

  async updateFulfillment(id: string, fulfilledQuantity: number): Promise<Shipment> {
    const shipment = await this.findOne(id);
    
    shipment.fulfilledQuantity = fulfilledQuantity;
    
    if (shipment.totalQuantity > 0) {
      shipment.fulfillmentPercentage = (fulfilledQuantity / shipment.totalQuantity) * 100;
    }

    // Update status based on fulfillment
    const previousStatus = shipment.status;
    if (shipment.fulfillmentPercentage >= 100) {
      shipment.status = ShipmentStatus.SHIPPED;
      shipment.shippedAt = new Date();
    } else if (shipment.fulfillmentPercentage > 0) {
      shipment.status = ShipmentStatus.PARTIALLY_SHIPPED;
    }

    const updatedShipment = await this.shipmentsRepository.save(shipment);

    // Trigger webhook for fulfillment update
    if (previousStatus !== updatedShipment.status) {
      const event = updatedShipment.status === ShipmentStatus.SHIPPED
        ? WebhookEvent.SHIPMENT_SHIPPED
        : WebhookEvent.SHIPMENT_PARTIALLY_SHIPPED;

      await this.webhooksService.triggerWebhook(
        updatedShipment.customerId,
        event,
        updatedShipment,
      );
    } else {
      await this.webhooksService.triggerWebhook(
        updatedShipment.customerId,
        WebhookEvent.SHIPMENT_UPDATED,
        updatedShipment,
      );
    }

    return updatedShipment;
  }

  async addFulfilledQuantity(id: string, additionalQuantity: number): Promise<Shipment> {
    const shipment = await this.findOne(id);
    return this.updateFulfillment(id, shipment.fulfilledQuantity + additionalQuantity);
  }

  async remove(id: string): Promise<void> {
    await this.shipmentsRepository.softDelete(id);
  }
}
