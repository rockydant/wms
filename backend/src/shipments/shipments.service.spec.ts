import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { CustomersService } from '../customers/customers.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { NotFoundException } from '@nestjs/common';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let shipmentRepository: Repository<Shipment>;
  let shipmentItemRepository: Repository<ShipmentItem>;
  let customersService: CustomersService;
  let webhooksService: WebhooksService;

  const mockShipmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockShipmentItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCustomersService = {
    findOne: jest.fn(),
  };

  const mockWebhooksService = {
    triggerWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
        {
          provide: getRepositoryToken(ShipmentItem),
          useValue: mockShipmentItemRepository,
        },
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
    shipmentRepository = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
    shipmentItemRepository = module.get<Repository<ShipmentItem>>(
      getRepositoryToken(ShipmentItem),
    );
    customersService = module.get<CustomersService>(CustomersService);
    webhooksService = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a shipment', async () => {
      const createDto = {
        customerId: '1',
        warehouseId: 'warehouse-1',
        items: [
          { sku: 'SKU001', size: 'M', color: 'Blue', quantity: 5 },
        ],
      };

      const mockShipment = {
        id: 'shipment-1',
        customerId: '1',
        warehouseId: 'warehouse-1',
        status: 'Pending',
        totalQuantity: 5,
        fulfilledQuantity: 0,
        fulfillmentPercentage: 0,
        items: createDto.items,
      };

      mockCustomersService.findOne.mockResolvedValue({ id: '1' });
      mockShipmentRepository.create.mockReturnValue(mockShipment);
      mockShipmentRepository.save.mockResolvedValue(mockShipment);
      mockShipmentItemRepository.create.mockImplementation((item) => ({
        ...item,
        shipmentId: 'shipment-1',
      }));
      mockShipmentItemRepository.save.mockResolvedValue([]);
      mockShipmentRepository.findOne.mockResolvedValue({
        ...mockShipment,
        customer: { id: '1' },
        warehouse: { id: 'warehouse-1' },
        items: createDto.items,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockCustomersService.findOne).toHaveBeenCalledWith('1');
      expect(mockShipmentRepository.create).toHaveBeenCalled();
      expect(mockWebhooksService.triggerWebhook).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a shipment by id', async () => {
      const mockShipment = {
        id: 'shipment-1',
        customerId: '1',
        warehouseId: 'warehouse-1',
        status: 'Pending',
      };

      mockShipmentRepository.findOne.mockResolvedValue(mockShipment);

      const result = await service.findOne('shipment-1');

      expect(result).toEqual(mockShipment);
    });

    it('should throw NotFoundException when shipment not found', async () => {
      mockShipmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('shipment-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update shipment status', async () => {
      const mockShipment = {
        id: 'shipment-1',
        customerId: '1',
        status: 'Pending',
        save: jest.fn(),
      };

      mockShipmentRepository.findOne.mockResolvedValue(mockShipment);
      mockShipment.save.mockResolvedValue({
        ...mockShipment,
        status: 'Ready',
      });

      const result = await service.updateStatus('shipment-1', 'Ready' as any);

      expect(result.status).toBe('Ready');
      expect(mockWebhooksService.triggerWebhook).toHaveBeenCalled();
    });
  });
});
