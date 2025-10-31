import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtimeDashboardService } from './realtime-dashboard.service';
import { Shipment } from '../../../shipments/entities/shipment.entity';
import { PurchaseOrder } from '../../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../../picking/entities/order-queue.entity';
import { InventoryItem } from '../../../inventory/entities/inventory-item.entity';
import { WarehouseLocation } from '../../../warehouse/entities/warehouse-location.entity';

describe('RealtimeDashboardService', () => {
  let service: RealtimeDashboardService;
  let shipmentRepository: Repository<Shipment>;
  let purchaseOrderRepository: Repository<PurchaseOrder>;
  let orderQueueRepository: Repository<OrderQueue>;
  let inventoryRepository: Repository<InventoryItem>;
  let locationRepository: Repository<WarehouseLocation>;

  const mockShipmentRepository = {
    find: jest.fn(),
  };

  const mockPurchaseOrderRepository = {
    find: jest.fn(),
  };

  const mockOrderQueueRepository = {
    find: jest.fn(),
  };

  const mockInventoryRepository = {
    find: jest.fn(),
  };

  const mockLocationRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeDashboardService,
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
          provide: getRepositoryToken(InventoryItem),
          useValue: mockInventoryRepository,
        },
        {
          provide: getRepositoryToken(WarehouseLocation),
          useValue: mockLocationRepository,
        },
      ],
    }).compile();

    service = module.get<RealtimeDashboardService>(RealtimeDashboardService);
    shipmentRepository = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
    purchaseOrderRepository = module.get<Repository<PurchaseOrder>>(getRepositoryToken(PurchaseOrder));
    orderQueueRepository = module.get<Repository<OrderQueue>>(getRepositoryToken(OrderQueue));
    inventoryRepository = module.get<Repository<InventoryItem>>(getRepositoryToken(InventoryItem));
    locationRepository = module.get<Repository<WarehouseLocation>>(getRepositoryToken(WarehouseLocation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRealtimeDashboard', () => {
    it('should get real-time dashboard data', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const mockPOs = [
        {
          id: 'po-1',
          customerId: 'customer-1',
          status: 'Pending',
          createdAt: today,
          items: [],
        },
        {
          id: 'po-2',
          customerId: 'customer-1',
          status: 'Completed',
          receivedAt: today,
          items: [{ receivedQuantity: 10 }],
        },
      ];

      const mockQueues = [
        {
          id: 'queue-1',
          status: 'Pending',
          createdAt: today,
          shipment: { customerId: 'customer-1' },
          pickingItems: [],
        },
        {
          id: 'queue-2',
          status: 'Completed',
          completedAt: today,
          shipment: { customerId: 'customer-1' },
          pickingItems: [],
        },
      ];

      const mockShipments = [
        {
          id: 'shipment-1',
          customerId: 'customer-1',
          status: 'Pending',
          createdAt: today,
          totalQuantity: 10,
          fulfilledQuantity: 0,
          items: [],
        },
        {
          id: 'shipment-2',
          customerId: 'customer-1',
          status: 'Shipped',
          shippedAt: today,
          totalQuantity: 10,
          fulfilledQuantity: 10,
          items: [],
        },
      ];

      const mockInventory = [
        { id: '1', customerId: 'customer-1', status: 'Ready' },
      ];

      const mockLocations = [
        { id: '1', maxCapacity: 100, currentCapacity: 50, utilizationPercentage: 50 },
      ];

      mockPurchaseOrderRepository.find.mockResolvedValue(mockPOs);
      mockOrderQueueRepository.find.mockResolvedValue(mockQueues);
      mockShipmentRepository.find.mockResolvedValue(mockShipments);
      mockInventoryRepository.find.mockResolvedValue(mockInventory);
      mockLocationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.getRealtimeDashboard();

      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.today).toBeDefined();
      expect(result.today.receiving).toBeDefined();
      expect(result.today.picking).toBeDefined();
      expect(result.today.shipping).toBeDefined();
      expect(result.inventory).toBeDefined();
      expect(result.warehouse).toBeDefined();
      expect(result.activeOperations).toBeDefined();
      expect(result.alerts).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should filter by warehouseId and customerId', async () => {
      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);
      mockShipmentRepository.find.mockResolvedValue([]);
      mockInventoryRepository.find.mockResolvedValue([]);
      mockLocationRepository.find.mockResolvedValue([]);

      await service.getRealtimeDashboard('warehouse-1', 'customer-1');

      expect(mockShipmentRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', warehouseId: 'warehouse-1' },
        relations: ['items'],
      });
    });

    it('should calculate alerts for old pending shipments', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5); // 5 days ago

      const mockShipments = [
        {
          id: 'shipment-1',
          customerId: 'customer-1',
          status: 'Pending',
          createdAt: oldDate,
          items: [],
        },
      ];

      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);
      mockShipmentRepository.find.mockResolvedValue(mockShipments);
      mockInventoryRepository.find.mockResolvedValue([]);
      mockLocationRepository.find.mockResolvedValue([]);

      const result = await service.getRealtimeDashboard();

      expect(result.alerts).toBeDefined();
      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts.some((alert: any) => alert.category === 'Shipments')).toBe(true);
    });
  });
});
