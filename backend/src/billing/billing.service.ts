import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingInvoice, InvoiceStatus, BillingType } from './entities/billing-invoice.entity';
import { BillingInvoiceItem } from './entities/billing-invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CustomersService } from '../customers/customers.service';
import { ShipmentsService } from '../shipments/shipments.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingInvoice)
    private invoiceRepository: Repository<BillingInvoice>,
    @InjectRepository(BillingInvoiceItem)
    private invoiceItemRepository: Repository<BillingInvoiceItem>,
    private customersService: CustomersService,
    private shipmentsService: ShipmentsService,
    private inventoryService: InventoryService,
  ) {}

  async create(createDto: CreateInvoiceDto): Promise<BillingInvoice> {
    // Verify customer exists
    await this.customersService.findOne(createDto.customerId);

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const invoice = this.invoiceRepository.create({
      ...createDto,
      invoiceNumber,
      status: InvoiceStatus.DRAFT,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create invoice items
    const items = createDto.items.map((item) =>
      this.invoiceItemRepository.create({
        ...item,
        invoiceId: savedInvoice.id,
        amount: item.quantity * item.unitPrice,
      }),
    );

    await this.invoiceItemRepository.save(items);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (createDto.taxRate || 0);
    const total = subtotal + tax;

    savedInvoice.subtotal = subtotal;
    savedInvoice.tax = tax;
    savedInvoice.total = total;
    savedInvoice.items = items;

    return this.invoiceRepository.save(savedInvoice);
  }

  async findAll(customerId?: string): Promise<BillingInvoice[]> {
    const where = customerId ? { customerId } : {};
    return this.invoiceRepository.find({
      where,
      relations: ['customer', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BillingInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['customer', 'items'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async update(id: string, updateDto: UpdateInvoiceDto): Promise<BillingInvoice> {
    await this.invoiceRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.invoiceRepository.softDelete(id);
  }

  /**
   * Generate invoice based on usage (storage, shipments, etc.)
   */
  async generateInvoiceForPeriod(
    customerId: string,
    startDate: Date,
    endDate: Date,
    billingTypes: BillingType[],
  ): Promise<BillingInvoice> {
    await this.customersService.findOne(customerId);

    const items: any[] = [];

    // Calculate storage charges (per cubic feet or per item)
    if (billingTypes.includes(BillingType.STORAGE) || billingTypes.includes(BillingType.CUBIC_FEET)) {
      const inventoryItems = await this.inventoryService.findByCustomer(customerId);
      const storageItems = inventoryItems.filter(
        (item) =>
          item.status !== 'Shipped' &&
          item.createdAt >= startDate &&
          item.createdAt <= endDate,
      );

      // Calculate cubic feet (assuming average size per item)
      const cubicFeet = storageItems.length * 0.5; // Placeholder: 0.5 cubic feet per item
      const storageRate = 5.0; // $5 per cubic foot

      if (cubicFeet > 0) {
        items.push({
          billingType: BillingType.CUBIC_FEET,
          description: `Storage (${cubicFeet.toFixed(2)} cubic feet)`,
          quantity: 1,
          unitPrice: cubicFeet * storageRate,
          amount: cubicFeet * storageRate,
        });
      }
    }

    // Calculate shipment charges (per order count)
    if (billingTypes.includes(BillingType.SHIPMENT) || billingTypes.includes(BillingType.ORDER_COUNT)) {
      const shipments = await this.shipmentsService.findByCustomer(customerId);
      const periodShipments = shipments.filter(
        (shipment) =>
          shipment.shippedAt &&
          shipment.shippedAt >= startDate &&
          shipment.shippedAt <= endDate,
      );

      const shipmentCount = periodShipments.length;
      const shipmentRate = 2.5; // $2.50 per shipment

      if (shipmentCount > 0) {
        items.push({
          billingType: BillingType.ORDER_COUNT,
          description: `Shipments (${shipmentCount} orders)`,
          quantity: shipmentCount,
          unitPrice: shipmentRate,
          amount: shipmentCount * shipmentRate,
        });
      }
    }

    // Calculate fulfillment charges
    if (billingTypes.includes(BillingType.FULFILLMENT)) {
      const shipments = await this.shipmentsService.findByCustomer(customerId);
      const periodShipments = shipments.filter(
        (shipment) =>
          shipment.shippedAt &&
          shipment.shippedAt >= startDate &&
          shipment.shippedAt <= endDate,
      );

      const fulfillmentCount = periodShipments.reduce(
        (sum, shipment) => sum + shipment.fulfilledQuantity,
        0,
      );
      const fulfillmentRate = 0.5; // $0.50 per fulfilled item

      if (fulfillmentCount > 0) {
        items.push({
          billingType: BillingType.FULFILLMENT,
          description: `Fulfillment (${fulfillmentCount} items)`,
          quantity: fulfillmentCount,
          unitPrice: fulfillmentRate,
          amount: fulfillmentCount * fulfillmentRate,
        });
      }
    }

    if (items.length === 0) {
      throw new Error('No billable items found for the specified period');
    }

    return this.create({
      customerId,
      billingPeriodStart: startDate,
      billingPeriodEnd: endDate,
      billingTypes,
      items,
      dueDate: new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after end date
    });
  }

  async markAsPaid(id: string): Promise<BillingInvoice> {
    const invoice = await this.findOne(id);
    invoice.status = InvoiceStatus.PAID;
    invoice.paidDate = new Date();
    return this.invoiceRepository.save(invoice);
  }
}
