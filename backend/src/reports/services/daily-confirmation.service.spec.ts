import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyConfirmationService } from './daily-confirmation.service';
import { Shipment } from '../../../shipments/entities/shipment.entity';
import { PurchaseOrder } from '../../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../../picking/entities/order-queue.entity';
import { Customer } from '../../../customers/entities/customer.entity';
import { WebhooksService } from '../../../webhooks/webhooks.service';
import { NotFoundException } from '@nestjs/common';

describe('DailyConfirmationService', () => {
  let service: DailyConfirmationService;
  let shipmentRepository: Repository<Shipment>;
  let purchaseOrderRepository: Repository<PurchaseOrder>;
  let orderQueueRepository: Repository<OrderQueue>;
  let customerRepository: Repository<Customer>;
  let webhooksService: WebhooksService;

  const mockShipmentRepository = {
    find: jest.fn(),
  };

  const mockPurchaseOrderRepository = {
    find: jest.fn(),
  };

  const mockOrderQueueRepository = {
    find: jest.fn(),
  };

  const mockCustomerRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockWebhooksService = {
    triggerWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyConfirmationService,
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: mockPurchaseOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderQueue),
          useValue: mockOrderQueueRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
      ],
    }).compile();

    service = module.get<DailyConfirmationService>(DailyConfirmationService);
    shipmentRepository = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
    purchaseOrderRepository = module.get<Repository<PurchaseOrder>>(getRepositoryToken(PurchaseOrder));
    orderQueueRepository = module.get<Repository<OrderQueue>>(getRepositoryToken(OrderQueue));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    webhooksService = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDailyConfirmationReport', () => {
    it('should generate daily confirmation report for customer', async () => {
      const customerId = 'customer-1';
      const date = new Date('2025-01-15');

      const mockCustomer = {
        id: customerId,
        name: 'Test Customer',
        contactEmail: 'test@example.com',
      };

      const mockShipments = [
        {
          id: 'shipment-1',
          customerId,
          status: 'Shipped',
          totalQuantity: 10,
          fulfilledQuantity: 10,
          fulfillmentPercentage: 100,
          createdAt: date,
          shippedAt: date,
          items: [
            { sku: 'SKU001', size: 'M', color: 'Blue', quantity: 10 },
          ],
        },
      ];

      const mockPOs = [
        {
          id: 'po-1',
          customerId,
          poNumber: 'PO-001',
          status: 'Completed',
          receivedAt: date,
          items: [
            { expectedQuantity: 10, receivedQuantity: 10 },
          ],
        },
      ];

      const mockQueues = [
        {
          id: 'queue-1',
          shipment: { customerId },
          completedAt: date,
        },
      ];

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockShipmentRepository.find.mockResolvedValue(mockShipments);
      mockPurchaseOrderRepository.find.mockResolvedValue(mockPOs);
      mockOrderQueueRepository.find.mockResolvedValue(mockQueues);

      const result = await service.generateDailyConfirmationReport(customerId, date);

      expect(result).toBeDefined();
      expect(result.customer.id).toBe(customerId);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalItemsShipped).toBe(10);
      expect(result.shipments).toHaveLength(1);
      expect(result.purchaseOrders).toHaveLength(1);
    });

    it('should throw error if customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.generateDailyConfirmationReport('invalid-id')).rejects.toThrow();
    });

    it('should use current date if date not provided', async () => {
      const customerId = 'customer-1';
      const mockCustomer = {
        id: customerId,
        name: 'Test Customer',
        contactEmail: 'test@example.com',
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockShipmentRepository.find.mockResolvedValue([]);
      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);

      const result = await service.generateDailyConfirmationReport(customerId);

      expect(result).toBeDefined();
      expect(result.reportDate).toBeDefined();
    });
  });

  describe('generateAllDailyConfirmationReports', () => {
    it('should generate reports for all active customers', async () => {
      const mockCustomers = [
        { id: 'customer-1', name: 'Customer 1', isActive: true },
        { id: 'customer-2', name: 'Customer 2', isActive: true },
      ];

      mockCustomerRepository.find.mockResolvedValue(mockCustomers);
      mockCustomerRepository.findOne.mockResolvedValue(mockCustomers[0]);
      mockShipmentRepository.find.mockResolvedValue([]);
      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);

      const results = await service.generateAllDailyConfirmationReports();

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('sendDailyConfirmationReport', () => {
    it('should send daily confirmation report via webhook', async () => {
      const customerId = 'customer-1';
      const mockCustomer = {
        id: customerId,
        name: 'Test Customer',
        contactEmail: 'test@example.com',
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockShipmentRepository.find.mockResolvedValue([]);
      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);
      mockWebhooksService.triggerWebhook.mockResolvedValue(undefined);

      await service.sendDailyConfirmationReport(customerId);

      expect(mockWebhooksService.triggerWebhook).toHaveBeenCalled();
    });
  });

  describe('getReportTemplate', () => {
    it('should generate report template', () => {
      const report = {
        reportDate: '2025-01-15',
        customer: {
          name: 'Test Customer',
        },
        summary: {
          totalItemsReceived: 10,
          totalItemsShipped: 8,
          totalShipments: 2,
          completedShipments: 2,
          pendingShipments: 0,
          totalPurchaseOrders: 1,
          totalPickingQueues: 1,
        },
        shipments: [
          {
            id: 'shipment-1',
            status: 'Shipped',
            fulfilledQuantity: 8,
            totalQuantity: 8,
          },
        ],
        generatedAt: new Date(),
      };

      const template = service.getReportTemplate(report);

      expect(template).toBeDefined();
      expect(template).toContain('Daily Confirmation Report');
      expect(template).toContain('Test Customer');
      expect(template).toContain('10'); // totalItemsReceived
      expect(template).toContain('8'); // totalItemsShipped
    });
  });
});
