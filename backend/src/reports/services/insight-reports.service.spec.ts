import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsightReportsService } from './insight-reports.service';
import { Shipment } from '../../../shipments/entities/shipment.entity';
import { InventoryItem } from '../../../inventory/entities/inventory-item.entity';
import { PurchaseOrder } from '../../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../../picking/entities/order-queue.entity';
import { BillingInvoice } from '../../../billing/entities/billing-invoice.entity';
import { FreightBooking } from '../../../freight-booking/entities/freight-booking.entity';
import { WarehouseLocation } from '../../../warehouse/entities/warehouse-location.entity';

describe('InsightReportsService', () => {
  let service: InsightReportsService;
  let shipmentRepository: Repository<Shipment>;
  let inventoryRepository: Repository<InventoryItem>;
  let purchaseOrderRepository: Repository<PurchaseOrder>;
  let orderQueueRepository: Repository<OrderQueue>;
  let invoiceRepository: Repository<BillingInvoice>;
  let freightBookingRepository: Repository<FreightBooking>;
  let locationRepository: Repository<WarehouseLocation>;

  const mockShipmentRepository = {
    find: jest.fn(),
  };

  const mockInventoryRepository = {
    find: jest.fn(),
  };

  const mockPurchaseOrderRepository = {
    find: jest.fn(),
  };

  const mockOrderQueueRepository = {
    find: jest.fn(),
  };

  const mockInvoiceRepository = {
    find: jest.fn(),
  };

  const mockFreightBookingRepository = {
    find: jest.fn(),
  };

  const mockLocationRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightReportsService,
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockInventoryRepository,
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
          provide: getRepositoryToken(BillingInvoice),
          useValue: mockInvoiceRepository,
        },
        {
          provide: getRepositoryToken(FreightBooking),
          useValue: mockFreightBookingRepository,
        },
        {
          provide: getRepositoryToken(WarehouseLocation),
          useValue: mockLocationRepository,
        },
      ],
    }).compile();

    service = module.get<InsightReportsService>(InsightReportsService);
    shipmentRepository = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
    inventoryRepository = module.get<Repository<InventoryItem>>(getRepositoryToken(InventoryItem));
    purchaseOrderRepository = module.get<Repository<PurchaseOrder>>(getRepositoryToken(PurchaseOrder));
    orderQueueRepository = module.get<Repository<OrderQueue>>(getRepositoryToken(OrderQueue));
    invoiceRepository = module.get<Repository<BillingInvoice>>(getRepositoryToken(BillingInvoice));
    freightBookingRepository = module.get<Repository<FreightBooking>>(getRepositoryToken(FreightBooking));
    locationRepository = module.get<Repository<WarehouseLocation>>(getRepositoryToken(WarehouseLocation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExecutiveInsightReport', () => {
    it('should generate executive insight report', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const mockShipments = [
        {
          id: '1',
          customerId: 'customer-1',
          status: 'Shipped',
          totalQuantity: 10,
          fulfilledQuantity: 10,
          createdAt: new Date('2025-01-15'),
          shippedAt: new Date('2025-01-16'),
          items: [],
        },
      ];

      const mockInventory = [
        { id: '1', customerId: 'customer-1', status: 'Ready', locationId: 'loc-1' },
      ];

      const mockPOs = [
        {
          id: '1',
          customerId: 'customer-1',
          status: 'Completed',
          createdAt: new Date('2025-01-10'),
          receivedAt: new Date('2025-01-12'),
          items: [],
        },
      ];

      const mockQueues = [
        {
          id: '1',
          status: 'Completed',
          createdAt: new Date('2025-01-15'),
          completedAt: new Date('2025-01-15'),
        },
      ];

      const mockInvoices = [
        {
          id: '1',
          customerId: 'customer-1',
          total: 1000,
          status: 'Paid',
          issueDate: new Date('2025-01-15'),
        },
      ];

      const mockLocations = [
        { id: '1', maxCapacity: 100, currentCapacity: 50 },
      ];

      mockShipmentRepository.find.mockResolvedValue(mockShipments);
      mockInventoryRepository.find.mockResolvedValue(mockInventory);
      mockPurchaseOrderRepository.find.mockResolvedValue(mockPOs);
      mockOrderQueueRepository.find.mockResolvedValue(mockQueues);
      mockInvoiceRepository.find.mockResolvedValue(mockInvoices);
      mockLocationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.getExecutiveInsightReport(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.kpis).toBeDefined();
      expect(result.kpis.shipmentMetrics).toBeDefined();
      expect(result.kpis.inventoryMetrics).toBeDefined();
      expect(result.kpis.financialMetrics).toBeDefined();
      expect(result.kpis.operationalMetrics).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should filter by customerId and warehouseId', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockShipmentRepository.find.mockResolvedValue([]);
      mockInventoryRepository.find.mockResolvedValue([]);
      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);
      mockInvoiceRepository.find.mockResolvedValue([]);
      mockLocationRepository.find.mockResolvedValue([]);

      await service.getExecutiveInsightReport(startDate, endDate, 'customer-1', 'warehouse-1');

      expect(mockShipmentRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', warehouseId: 'warehouse-1' },
        relations: ['items'],
      });
    });
  });

  describe('getFinancialSummaryReport', () => {
    it('should generate financial summary report', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const mockInvoices = [
        {
          id: '1',
          customerId: 'customer-1',
          total: 1000,
          status: 'Paid',
          issueDate: new Date('2025-01-15'),
          customer: { id: 'customer-1', name: 'Customer 1' },
        },
        {
          id: '2',
          customerId: 'customer-2',
          total: 500,
          status: 'Pending',
          issueDate: new Date('2025-01-20'),
          customer: { id: 'customer-2', name: 'Customer 2' },
        },
      ];

      mockInvoiceRepository.find.mockResolvedValue(mockInvoices);

      const result = await service.getFinancialSummaryReport(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.revenueByMonth).toBeDefined();
      expect(result.topCustomers).toBeDefined();
    });
  });

  describe('trend calculation', () => {
    it('should identify increasing trend', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      // Mock shipments with increasing trend
      const mockShipments = Array.from({ length: 7 }, (_, i) => ({
        id: `shipment-${i}`,
        customerId: 'customer-1',
        createdAt: new Date(`2025-01-0${i + 1}`),
        status: 'Shipped',
        totalQuantity: i + 1,
        fulfilledQuantity: i + 1,
        items: [],
      }));

      mockShipmentRepository.find.mockResolvedValue(mockShipments);
      mockInventoryRepository.find.mockResolvedValue([]);
      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);
      mockInvoiceRepository.find.mockResolvedValue([]);
      mockLocationRepository.find.mockResolvedValue([]);

      const result = await service.getExecutiveInsightReport(startDate, endDate);

      expect(result.trends).toBeDefined();
    });
  });
});
