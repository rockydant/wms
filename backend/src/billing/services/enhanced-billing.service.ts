import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingInvoice } from '../entities/billing-invoice.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { WarehouseLocation } from '../../warehouse/entities/warehouse-location.entity';

/**
 * Enhanced Billing Service
 * Provides billing calculations per cubic feet or order count
 */
@Injectable()
export class EnhancedBillingService {
  constructor(
    @InjectRepository(BillingInvoice)
    private invoiceRepository: Repository<BillingInvoice>,
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(WarehouseLocation)
    private locationRepository: Repository<WarehouseLocation>,
  ) {}

  /**
   * Calculate storage cost per cubic feet
   */
  async calculateStorageCostByVolume(
    customerId: string,
    startDate: Date,
    endDate: Date,
    ratePerCubicFoot: number = 0.50,
  ): Promise<number> {
    // Get all inventory items for customer
    const inventoryItems = await this.inventoryRepository.find({
      where: { customerId },
      relations: ['location'],
    });

    let totalCubicFeetDays = 0;

    for (const item of inventoryItems) {
      // Calculate volume (simplified: assume each item = 0.5 cubic feet)
      const itemVolume = this.estimateItemVolume(item);

      // Calculate days in storage
      const receivedDate = item.receivedAt || item.createdAt;
      if (receivedDate) {
        const storageStart = new Date(receivedDate) > startDate ? receivedDate : startDate;
        const storageEnd = new Date(endDate);
        const daysInStorage = Math.max(
          0,
          Math.ceil((storageEnd.getTime() - storageStart.getTime()) / (1000 * 60 * 60 * 24)),
        );

        totalCubicFeetDays += itemVolume * daysInStorage;
      }
    }

    return totalCubicFeetDays * ratePerCubicFoot;
  }

  /**
   * Calculate billing per order count
   */
  async calculateBillingPerOrder(
    customerId: string,
    startDate: Date,
    endDate: Date,
    ratePerOrder: number = 2.00,
  ): Promise<number> {
    const shipments = await this.shipmentRepository.find({
      where: { customerId },
    });

    const ordersInPeriod = shipments.filter((shipment) => {
      const shippedDate = shipment.shippedAt || shipment.createdAt;
      return shippedDate && shippedDate >= startDate && shippedDate <= endDate;
    });

    return ordersInPeriod.length * ratePerOrder;
  }

  /**
   * Generate enhanced invoice with cubic feet and order count billing
   */
  async generateEnhancedInvoice(
    customerId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    storageRate?: number,
    orderRate?: number,
  ): Promise<any> {
    const storageCost = await this.calculateStorageCostByVolume(
      customerId,
      billingPeriodStart,
      billingPeriodEnd,
      storageRate,
    );

    const orderCost = await this.calculateBillingPerOrder(
      customerId,
      billingPeriodStart,
      billingPeriodEnd,
      orderRate,
    );

    // Get detailed breakdown
    const inventoryItems = await this.inventoryRepository.find({
      where: { customerId },
      relations: ['location'],
    });

    const shipments = await this.shipmentRepository.find({
      where: { customerId },
    });

    const breakdown = {
      storage: {
        totalCubicFeet: await this.getTotalCubicFeet(inventoryItems),
        cubicFeetDays: await this.getTotalCubicFeetDays(
          inventoryItems,
          billingPeriodStart,
          billingPeriodEnd,
        ),
        rate: storageRate || 0.50,
        amount: storageCost,
      },
      orders: {
        totalOrders: shipments.filter(
          (s) =>
            s.shippedAt &&
            s.shippedAt >= billingPeriodStart &&
            s.shippedAt <= billingPeriodEnd,
        ).length,
        rate: orderRate || 2.00,
        amount: orderCost,
      },
    };

    return {
      customerId,
      billingPeriodStart,
      billingPeriodEnd,
      breakdown,
      subtotal: storageCost + orderCost,
      tax: (storageCost + orderCost) * 0.08,
      total: (storageCost + orderCost) * 1.08,
    };
  }

  /**
   * Estimate item volume in cubic feet
   */
  private estimateItemVolume(item: InventoryItem): number {
    // Simplified estimation: apparel items are roughly 0.5 cubic feet
    // In a real system, this would use actual dimensions or weight
    return 0.5;
  }

  /**
   * Get total cubic feet for inventory items
   */
  private async getTotalCubicFeet(items: InventoryItem[]): Promise<number> {
    let total = 0;
    for (const item of items) {
      total += this.estimateItemVolume(item);
    }
    return Math.round(total * 100) / 100;
  }

  /**
   * Get total cubic feet-days for billing period
   */
  private async getTotalCubicFeetDays(
    items: InventoryItem[],
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    let total = 0;

    for (const item of items) {
      const volume = this.estimateItemVolume(item);
      const receivedDate = item.receivedAt || item.createdAt;

      if (receivedDate) {
        const storageStart = new Date(receivedDate) > startDate ? receivedDate : startDate;
        const storageEnd = new Date(endDate);
        const days = Math.max(
          0,
          Math.ceil((storageEnd.getTime() - storageStart.getTime()) / (1000 * 60 * 60 * 24)),
        );

        total += volume * days;
      }
    }

    return Math.round(total * 100) / 100;
  }

  /**
   * Get detailed billing report
   */
  async getDetailedBillingReport(
    customerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const invoice = await this.generateEnhancedInvoice(
      customerId,
      startDate,
      endDate,
    );

    // Get item-level details
    const inventoryItems = await this.inventoryRepository.find({
      where: { customerId },
      relations: ['location'],
    });

    const itemDetails = inventoryItems.map((item) => {
      const volume = this.estimateItemVolume(item);
      const receivedDate = item.receivedAt || item.createdAt;
      let daysInStorage = 0;

      if (receivedDate) {
        const storageStart =
          new Date(receivedDate) > startDate ? receivedDate : startDate;
        const storageEnd = new Date(endDate);
        daysInStorage = Math.max(
          0,
          Math.ceil(
            (storageEnd.getTime() - storageStart.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
      }

      return {
        sku: item.sku,
        size: item.size,
        color: item.color,
        locationCode: item.location?.locationCode,
        volume,
        daysInStorage,
        cubicFeetDays: volume * daysInStorage,
      };
    });

    return {
      ...invoice,
      itemDetails,
      summary: {
        totalItems: inventoryItems.length,
        averageCubicFeetPerItem: invoice.breakdown.storage.totalCubicFeet / inventoryItems.length,
        averageDaysInStorage:
          itemDetails.reduce((sum, item) => sum + item.daysInStorage, 0) /
          itemDetails.length,
      },
    };
  }
}
