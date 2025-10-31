import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreightManagementService } from './freight-management.service';
import { FreightConfig, CarrierType, PricingModel } from '../entities/freight-config.entity';
import { Shipment } from '../../shipments/entities/shipment.entity';

describe('FreightManagementService', () => {
  let service: FreightManagementService;
  let freightConfigRepository: Repository<FreightConfig>;
  let shipmentRepository: Repository<Shipment>;

  const mockFreightConfigRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockShipmentRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreightManagementService,
        {
          provide: getRepositoryToken(FreightConfig),
          useValue: mockFreightConfigRepository,
        },
        {
          provide: getRepositoryToken(Shipment),
          useValue: mockShipmentRepository,
        },
      ],
    }).compile();

    service = module.get<FreightManagementService>(FreightManagementService);
    freightConfigRepository = module.get<Repository<FreightConfig>>(getRepositoryToken(FreightConfig));
    shipmentRepository = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllConfigs', () => {
    it('should return all freight configurations', async () => {
      const mockConfigs = [
        { id: '1', name: 'UPS Ground', carrierType: 'UPS', isActive: true },
      ];
      mockFreightConfigRepository.find.mockResolvedValue(mockConfigs);

      const configs = await service.getAllConfigs();

      expect(configs).toBeDefined();
      expect(Array.isArray(configs)).toBe(true);
      expect(mockFreightConfigRepository.find).toHaveBeenCalled();
    });
  });

  describe('getActiveConfigs', () => {
    it('should return only active configurations', async () => {
      const mockConfigs = [
        { id: '1', name: 'UPS Ground', carrierType: 'UPS', isActive: true },
      ];
      mockFreightConfigRepository.find.mockResolvedValue(mockConfigs);

      const activeConfigs = await service.getActiveConfigs();

      expect(activeConfigs).toBeDefined();
      expect(Array.isArray(activeConfigs)).toBe(true);
    });
  });

  describe('getConfigById', () => {
    it('should return configuration by ID', async () => {
      const mockConfig = { id: 'ups-ground', name: 'UPS Ground', carrierType: 'UPS', isActive: true };
      mockFreightConfigRepository.findOne.mockResolvedValue(mockConfig);

      const config = await service.getConfigById('ups-ground');

      expect(config).toBeDefined();
      expect(config.id).toBe('ups-ground');
    });

    it('should throw error for non-existent ID', async () => {
      mockFreightConfigRepository.findOne.mockResolvedValue(null);

      await expect(service.getConfigById('non-existent')).rejects.toThrow();
    });
  });

  describe('getConfigsByCarrier', () => {
    it('should return configurations for specific carrier', async () => {
      const mockConfigs = [
        { id: '1', name: 'UPS Ground', carrierType: 'UPS', isActive: true },
      ];
      mockFreightConfigRepository.find.mockResolvedValue(mockConfigs);

      const upsConfigs = await service.getConfigsByCarrier('UPS');

      expect(upsConfigs).toBeDefined();
      expect(Array.isArray(upsConfigs)).toBe(true);
    });
  });

  describe('createConfig', () => {
    it('should create new freight configuration', async () => {
      const createDto = {
        name: 'DHL Express',
        carrierType: CarrierType.DHL,
        pricingModel: PricingModel.WEIGHT_BASED,
        baseRate: 12.00,
        ratePerUnit: 1.20,
        minCharge: 15.00,
        estimatedTransitDays: 3,
      };

      const mockConfig = { id: '1', ...createDto, isActive: true, createdAt: new Date(), updatedAt: new Date() };
      mockFreightConfigRepository.create.mockReturnValue(mockConfig);
      mockFreightConfigRepository.save.mockResolvedValue(mockConfig);

      const config = await service.createConfig(createDto);

      expect(config).toBeDefined();
      expect(config.carrierType).toBe('DHL');
    });
  });

  describe('updateConfig', () => {
    it('should update existing configuration', async () => {
      const updateDto = { baseRate: 9.00 };
      const mockConfig = { id: '1', name: 'UPS Ground', baseRate: 9.00 };
      
      mockFreightConfigRepository.update.mockResolvedValue({ affected: 1 });
      mockFreightConfigRepository.findOne.mockResolvedValue(mockConfig);

      const config = await service.updateConfig('1', updateDto);

      expect(config).toBeDefined();
    });
  });

  describe('calculateShippingCost', () => {
    it('should calculate shipping cost correctly', async () => {
      const mockConfig = {
        id: '1',
        name: 'UPS Ground',
        baseRate: 5.00,
        ratePerUnit: 0.50,
        pricingModel: PricingModel.WEIGHT_BASED,
        isActive: true,
        minCharge: 10.00,
      };
      mockFreightConfigRepository.findOne.mockResolvedValue(mockConfig);

      const result = await service.calculateShippingCost('1', 5, 2, false);

      expect(result).toBeDefined();
      expect(result.cost).toBeGreaterThan(0);
    });
  });

  describe('getBestShippingOption', () => {
    it('should return best shipping option', async () => {
      const mockConfigs = [
        { id: '1', name: 'UPS Ground', isActive: true, supportsWeekendDelivery: false },
      ];
      mockFreightConfigRepository.find.mockResolvedValue(mockConfigs);

      const option = await service.getBestShippingOption(5, 2);

      expect(option).toBeDefined();
    });
  });

  describe('toggleConfigStatus', () => {
    it('should toggle configuration status', async () => {
      const mockConfig = { id: '1', name: 'UPS Ground', isActive: false };
      mockFreightConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockFreightConfigRepository.save.mockResolvedValue({ ...mockConfig, isActive: false });

      const config = await service.toggleConfigStatus('1', false);

      expect(config.isActive).toBe(false);
    });
  });

  describe('getFreightStatistics', () => {
    it('should get freight statistics', async () => {
      mockFreightConfigRepository.count.mockResolvedValue(5);
      mockFreightConfigRepository.count.mockResolvedValueOnce(3);
      mockShipmentRepository.count.mockResolvedValue(10);
      mockFreightConfigRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { carrierType: 'UPS', count: '2' },
        ]),
      });

      const stats = await service.getFreightStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalConfigurations).toBeDefined();
    });
  });
});
