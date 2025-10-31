import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { PurchaseOrder } from '../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../picking/entities/order-queue.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { WebhooksService } from '../../webhooks/webhooks.service';

/**
 * Daily Confirmation Report Service
 * Generates and sends daily confirmation reports to customers
 */
@Injectable()
export class DailyConfirmationService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(OrderQueue)
    private orderQueueRepository: Repository<OrderQueue>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private webhooksService: WebhooksService,
  ) {}

  /**
   * Generate daily confirmation report for a customer
   */
  async generateDailyConfirmationReport(customerId: string, date?: Date): Promise<any> {
    const targetDate = date || new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    const shipments = await this.shipmentRepository.find({
      where: { customerId },
      relations: ['items'],
    });

    const purchaseOrders = await this.purchaseOrderRepository.find({
      where: { customerId },
      relations: ['items'],
    });

    const orderQueues = await this.orderQueueRepository.find({
      relations: [],
    });

    // Filter by customer - need to load shipments separately if shipmentId exists
    let customerQueues = orderQueues;
    if (customerId) {
      const customerShipments = await this.shipmentRepository.find({
        where: { customerId },
        select: ['id', 'customerId'],
      });
      const shipmentIds = new Set(customerShipments.map(s => s.id));
      customerQueues = orderQueues.filter((q) => q.shipmentId && shipmentIds.has(q.shipmentId));
    }

    // Filter by date - use the shipments variable from above (already loaded with relations)
    const dayShipments = shipments.filter((s) => {
      const shipmentDate = new Date(s.createdAt);
      return shipmentDate >= startDate && shipmentDate <= endDate;
    });

    const dayPOs = purchaseOrders.filter((po) => {
      const poDate = new Date(po.receivedAt || po.createdAt);
      return poDate >= startDate && poDate <= endDate;
    });

    const dayQueues = customerQueues.filter((q) => {
      const queueDate = new Date(q.completedAt || q.createdAt);
      return queueDate >= startDate && queueDate <= endDate;
    });

    // Calculate summary
    const totalItemsReceived = dayPOs.reduce(
      (sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.receivedQuantity, 0),
      0,
    );

    const totalItemsShipped = dayShipments
      .filter((s) => s.status === 'Shipped' || s.status === 'Partially Shipped')
      .reduce((sum, s) => sum + s.fulfilledQuantity, 0);

    const pendingShipments = dayShipments.filter((s) => s.status === 'Pending').length;
    const completedShipments = dayShipments.filter(
      (s) => s.status === 'Shipped' || s.status === 'Partially Shipped',
    ).length;

    return {
      reportDate: targetDate.toISOString().split('T')[0],
      customer: {
        id: customer.id,
        name: customer.name,
        contactEmail: customer.contactEmail,
      },
      summary: {
        totalItemsReceived,
        totalItemsShipped,
        totalShipments: dayShipments.length,
        completedShipments,
        pendingShipments,
        totalPurchaseOrders: dayPOs.length,
        totalPickingQueues: dayQueues.length,
      },
      shipments: dayShipments.map((s) => ({
        id: s.id,
        status: s.status,
        totalQuantity: s.totalQuantity,
        fulfilledQuantity: s.fulfilledQuantity,
        fulfillmentPercentage: s.fulfillmentPercentage,
        createdAt: s.createdAt,
        shippedAt: s.shippedAt,
        items: s.items.map((item) => ({
          sku: item.sku,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      })),
      purchaseOrders: dayPOs.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        totalItems: po.items.reduce((sum, item) => sum + item.receivedQuantity, 0),
        receivedAt: po.receivedAt,
      })),
      generatedAt: new Date(),
    };
  }

  /**
   * Generate daily confirmation reports for all customers
   */
  async generateAllDailyConfirmationReports(date?: Date): Promise<any[]> {
    const customers = await this.customerRepository.find({
      where: { isActive: true },
    });

    const reports = await Promise.all(
      customers.map((customer) =>
        this.generateDailyConfirmationReport(customer.id, date).catch((error) => {
          console.error(`Error generating report for customer ${customer.id}:`, error);
          return null;
        }),
      ),
    );

    return reports.filter((report) => report !== null);
  }

  /**
   * Send daily confirmation report to customer (via webhook or email)
   */
  async sendDailyConfirmationReport(customerId: string, date?: Date): Promise<void> {
    const report = await this.generateDailyConfirmationReport(customerId, date);

    // Send via webhook if configured
    await this.webhooksService.triggerWebhook(
      customerId,
      'daily.confirmation.report' as any,
      report,
    );

    // In a real implementation, you would also send via email
    // await this.emailService.sendDailyReport(customer.contactEmail, report);
  }

  /**
   * Send daily confirmation reports to all active customers
   */
  async sendAllDailyConfirmationReports(date?: Date): Promise<void> {
    const customers = await this.customerRepository.find({
      where: { isActive: true },
    });

    await Promise.all(
      customers.map((customer) =>
        this.sendDailyConfirmationReport(customer.id, date).catch((error) => {
          console.error(`Error sending report for customer ${customer.id}:`, error);
        }),
      ),
    );
  }

  /**
   * Get daily confirmation report template (for email/PDF)
   */
  getReportTemplate(report: any): string {
    return `
Daily Confirmation Report - ${report.reportDate}
Customer: ${report.customer.name}

Summary:
- Items Received: ${report.summary.totalItemsReceived}
- Items Shipped: ${report.summary.totalItemsShipped}
- Total Shipments: ${report.summary.totalShipments}
- Completed Shipments: ${report.summary.completedShipments}
- Pending Shipments: ${report.summary.pendingShipments}
- Purchase Orders: ${report.summary.totalPurchaseOrders}

Shipments:
${report.shipments.map((s: any) => `- ${s.id}: ${s.status} (${s.fulfilledQuantity}/${s.totalQuantity})`).join('\n')}

Generated at: ${report.generatedAt}
    `.trim();
  }
}
