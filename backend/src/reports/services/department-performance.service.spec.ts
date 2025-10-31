import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentPerformanceService } from './department-performance.service';
import { PurchaseOrder } from '../../receiving/entities/purchase-order.entity';
import { OrderQueue } from '../../picking/entities/order-queue.entity';
import { PickingItem } from '../../picking/entities/picking-item.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';

describe('DepartmentPerformanceService', () => {
  let service: DepartmentPerformanceService;
  let purchaseOrderRepository: Repository<PurchaseOrder>;
  let orderQueueRepository: Repository<OrderQueue>;
  let pickingItemRepository: Repository<PickingItem>;
  let shipmentRepository: Repository<Shipment>;

  const mockPurchaseOrderRepository = {
    find: jest.fn(),
  };

  const mockOrderQueueRepository = {
    find: jest.fn(),
  };

  const mockPickingItemRepository = {
    find: jest.fn(),
  };

  const mockShipmentRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentPerformanceService,
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: mockPurchaseOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderQueue),
          useValue: mockOrderQueueRepository,
        },
        {
          provide: getRepositoryToken(PickingItem),
          useValue: mockPickingItemRepository,
        },
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
      ],
    }).compile();

    service = module.get<DepartmentPerformanceService>(DepartmentPerformanceService);
    purchaseOrderRepository = module.get<Repository<PurchaseOrder>>(getRepositoryToken(PurchaseOrder));
    orderQueueRepository = module.get<Repository<OrderQueue>>(getRepositoryToken(OrderQueue));
    pickingItemRepository = module.get<Repository<PickingItem>>(getRepositoryToken(PickingItem));
    shipmentRepository = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDepartmentPerformanceReport', () => {
    it('should generate department performance report', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const mockPOs = [
        {
          id: 'po-1',
          customerId: 'customer-1',
          status: 'Completed',
          createdAt: new Date('2025-01-15'),
          receivedAt: new Date('2025-01-16'),
          items: [
            { expectedQuantity: 10, receivedQuantity: 10 },
          ],
        },
      ];

      const mockQueues = [
        {
          id: 'queue-1',
          status: 'Completed',
          createdAt: new Date('2025-01-15'),
          completedAt: new Date('2025-01-16'),
          shipment: { customerId: 'customer-1' },
          pickingItems: [
            { id: 'item-1', verified: true },
            { id: 'item-2', verified: true },
          ],
        },
      ];

      const mockShipments = [
        {
          id: 'shipment-1',
          customerId: 'customer-1',
          status: 'Shipped',
          createdAt: new Date('2025-01-15'),
          shippedAt: new Date('2025-01-16'),
          fulfilledQuantity: 10,
        },
      ];

      mockPurchaseOrderRepository.find.mockResolvedValue(mockPOs);
      mockOrderQueueRepository.find.mockResolvedValue(mockQueues);
      mockShipmentRepository.find.mockResolvedValue(mockShipments);

      const result = await service.getDepartmentPerformanceReport(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.departments).toBeDefined();
      expect(result.departments.receiving).toBeDefined();
      expect(result.departments.picking).toBeDefined();
      expect(result.departments.qc).toBeDefined();
      expect(result.departments.packaging).toBeDefined();
      expect(result.overall).toBeDefined();
    });

    it('should filter by customerId and warehouseId', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockOrderQueueRepository.find.mockResolvedValue([]);
      mockShipmentRepository.find.mockResolvedValue([]);

      await service.getDepartmentPerformanceReport(startDate, endDate, 'customer-1', 'warehouse-1');

      expect(mockPurchaseOrderRepository.find).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', warehouseId: 'warehouse-1' },
        relations: ['items'],
      });
    });

    it('should calculate performance ratings correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      // Mock data with excellent performance (high completion rate, fast processing, high accuracy)
      const mockPOs = [
        {
          id: 'po-1',
          status: 'Completed',
          createdAt: new Date('2025-01-15'),
          receivedAt: new Date('2025-01-15T12:00:00'), // Same day
          items: [
            { expectedQuantity: 10, receivedQuantity: 10 },
          ],
        },
      ];

      const mockQueues = [
        {
          id: 'queue-1',
          status: 'Completed',
          createdAt: new Date('2025-01-15'),
          completedAt: new Date('2025-01-15T13:00:00'), // 1 hour later
          shipment: { customerId: 'customer-1' },
          pickingItems: [
            { id: 'item-1', verified: true },
            { id: 'item-2', verified: true },
          ],
        },
      ];

      const mockShipments = [
        {
          id: 'shipment-1',
          status: 'Shipped',
          createdAt: new Date('2025-01-15'),
          shippedAt: new Date('2025-01-15T14:00:00'),
          fulfilledQuantity: 10,
        },
      ];

      mockPurchaseOrderRepository.find.mockResolvedValue(mockPOs);
      mockOrderQueueRepository.find.mockResolvedValue(mockQueues);
      mockShipmentRepository.find.mockResolvedValue(mockShipments);

      const result = await service.getDepartmentPerformanceReport(startDate, endDate);

      expect(result.departments.receiving.performance).toBeDefined();
      expect(result.departments.picking.performance).toBeDefined();
      expect(result.overall.overallRating).toBeDefined();
    });
  });
});
