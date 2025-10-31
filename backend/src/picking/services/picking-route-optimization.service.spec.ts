import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickingRouteOptimizationService } from './picking-route-optimization.service';
import { OrderQueue } from '../entities/order-queue.entity';
import { PickingItem } from '../entities/picking-item.entity';
import { WarehouseLocation } from '../../warehouse/entities/warehouse-location.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { NotFoundException } from '@nestjs/common';

describe('PickingRouteOptimizationService', () => {
  let service: PickingRouteOptimizationService;
  let orderQueueRepository: Repository<OrderQueue>;
  let pickingItemRepository: Repository<PickingItem>;
  let locationRepository: Repository<WarehouseLocation>;
  let inventoryRepository: Repository<InventoryItem>;

  const mockOrderQueueRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockPickingItemRepository = {
    find: jest.fn(),
  };

  const mockLocationRepository = {
    find: jest.fn(),
  };

  const mockInventoryRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PickingRouteOptimizationService,
        {
          provide: getRepositoryToken(OrderQueue),
          useValue: mockOrderQueueRepository,
        },
        {
          provide: getRepositoryToken(PickingItem),
          useValue: mockPickingItemRepository,
        },
        {
          provide: getRepositoryToken(WarehouseLocation),
          useValue: mockLocationRepository,
        },
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockInventoryRepository,
        },
      ],
    }).compile();

    service = module.get<PickingRouteOptimizationService>(PickingRouteOptimizationService);
    orderQueueRepository = module.get<Repository<OrderQueue>>(getRepositoryToken(OrderQueue));
    pickingItemRepository = module.get<Repository<PickingItem>>(getRepositoryToken(PickingItem));
    locationRepository = module.get<Repository<WarehouseLocation>>(getRepositoryToken(WarehouseLocation));
    inventoryRepository = module.get<Repository<InventoryItem>>(getRepositoryToken(InventoryItem));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('optimizeRouteForOrderQueue', () => {
    it('should optimize route for order queue', async () => {
      const queueId = 'queue-1';

      const mockQueue = {
        id: queueId,
        pickingItems: [
          {
            id: 'item-1',
            pickedAt: null,
            inventoryItem: {
              id: 'inv-1',
              locationId: 'loc-1',
            },
          },
          {
            id: 'item-2',
            pickedAt: null,
            inventoryItem: {
              id: 'inv-2',
              locationId: 'loc-2',
            },
          },
        ],
      };

      const mockLocations = [
        {
          id: 'loc-1',
          warehouseId: 'warehouse-1',
          area: 'A',
          column: '1',
          rack: '1',
          bin: '1',
          locationCode: 'WH-A-1-1-1',
        },
        {
          id: 'loc-2',
          warehouseId: 'warehouse-1',
          area: 'A',
          column: '2',
          rack: '1',
          bin: '1',
          locationCode: 'WH-A-2-1-1',
        },
      ];

      mockOrderQueueRepository.findOne.mockResolvedValue(mockQueue);
      mockLocationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.optimizeRouteForOrderQueue(queueId);

      expect(result).toBeDefined();
      expect(result.route).toBeDefined();
      expect(result.sequence).toBeDefined();
      expect(result.totalDistance).toBeGreaterThanOrEqual(0);
      expect(result.estimatedTime).toBeGreaterThanOrEqual(0);
      expect(result.pickingItems).toBeDefined();
    });

    it('should throw error if queue not found', async () => {
      mockOrderQueueRepository.findOne.mockResolvedValue(null);

      await expect(service.optimizeRouteForOrderQueue('invalid-id')).rejects.toThrow();
    });

    it('should return empty route if no unpicked items', async () => {
      const mockQueue = {
        id: 'queue-1',
        pickingItems: [
          {
            id: 'item-1',
            pickedAt: new Date(),
            inventoryItem: {
              id: 'inv-1',
              locationId: 'loc-1',
            },
          },
        ],
      };

      mockOrderQueueRepository.findOne.mockResolvedValue(mockQueue);
      mockLocationRepository.find.mockResolvedValue([]);

      const result = await service.optimizeRouteForOrderQueue('queue-1');

      expect(result.route).toHaveLength(0);
      expect(result.totalDistance).toBe(0);
    });
  });

  describe('optimizeRouteForMultipleOrders', () => {
    it('should optimize route for multiple order queues', async () => {
      const queueIds = ['queue-1', 'queue-2'];

      const mockQueues = [
        {
          id: 'queue-1',
          pickingItems: [
            {
              id: 'item-1',
              pickedAt: null,
              inventoryItem: {
                id: 'inv-1',
                locationId: 'loc-1',
              },
            },
          ],
        },
        {
          id: 'queue-2',
          pickingItems: [
            {
              id: 'item-2',
              pickedAt: null,
              inventoryItem: {
                id: 'inv-2',
                locationId: 'loc-2',
              },
            },
          ],
        },
      ];

      const mockLocations = [
        {
          id: 'loc-1',
          area: 'A',
          column: '1',
          rack: '1',
          bin: '1',
          locationCode: 'WH-A-1-1-1',
        },
        {
          id: 'loc-2',
          area: 'A',
          column: '2',
          rack: '1',
          bin: '1',
          locationCode: 'WH-A-2-1-1',
        },
      ];

      mockOrderQueueRepository.find.mockResolvedValue(mockQueues);
      mockLocationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.optimizeRouteForMultipleOrders(queueIds);

      expect(result).toBeDefined();
      expect(result.route).toBeDefined();
      expect(result.pickingItems).toBeDefined();
    });
  });

  describe('getRouteVisualization', () => {
    it('should get route visualization data', async () => {
      const queueId = 'queue-1';

      const mockQueue = {
        id: queueId,
        pickingItems: [
          {
            id: 'item-1',
            pickedAt: null,
            inventoryItem: {
              id: 'inv-1',
              locationId: 'loc-1',
            },
          },
        ],
      };

      const mockLocations = [
        {
          id: 'loc-1',
          area: 'A',
          column: '1',
          rack: '1',
          bin: '1',
          locationCode: 'WH-A-1-1-1',
        },
      ];

      mockOrderQueueRepository.findOne.mockResolvedValue(mockQueue);
      mockLocationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.getRouteVisualization(queueId);

      expect(result).toBeDefined();
      expect(result.orderQueueId).toBe(queueId);
      expect(result.route).toBeDefined();
      expect(result.route.waypoints).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });
});
