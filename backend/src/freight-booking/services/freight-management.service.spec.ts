import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreightManagementService } from './freight-management.service';
import { FreightBooking } from '../entities/freight-booking.entity';

describe('FreightManagementService', () => {
  let service: FreightManagementService;
  let freightBookingRepository: Repository<FreightBooking>;

  const mockFreightBookingRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreightManagementService,
        {
          provide: getRepositoryToken(FreightBooking),
          useValue: mockFreightBookingRepository,
        },
      ],
    }).compile();

    service = module.get<FreightManagementService>(FreightManagementService);
    freightBookingRepository = module.get<Repository<FreightBooking>>(getRepositoryToken(FreightBooking));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllConfigs', () => {
    it('should return all freight configurations', () => {
      const configs = service.getAllConfigs();

      expect(configs).toBeDefined();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });
  });

  describe('getActiveConfigs', () => {
    it('should return only active configurations', () => {
      const activeConfigs = service.getActiveConfigs();

      expect(activeConfigs).toBeDefined();
      expect(Array.isArray(activeConfigs)).toBe(true);
      activeConfigs.forEach((config) => {
        expect(config.isActive).toBe(true);
      });
    });
  });

  describe('getConfigById', () => {
    it('should return configuration by ID', () => {
      const config = service.getConfigById('ups-ground');

      expect(config).toBeDefined();
      expect(config?.id).toBe('ups-ground');
    });

    it('should return undefined for non-existent ID', () => {
      const config = service.getConfigById('non-existent');

      expect(config).toBeUndefined();
    });
  });

  describe('getConfigsByCarrier', () => {
    it('should return configurations for specific carrier', () => {
      const upsConfigs = service.getConfigsByCarrier('UPS');

      expect(upsConfigs).toBeDefined();
      expect(Array.isArray(upsConfigs)).toBe(true);
      upsConfigs.forEach((config) => {
        expect(config.carrierType).toBe('UPS');
        expect(config.isActive).toBe(true);
      });
    });
  });

  describe('createConfig', () => {
    it('should create new freight configuration', () => {
      const createDto = {
        carrierType: 'DHL',
        carrierName: 'DHL Express',
        serviceName: 'DHL Express Worldwide',
        baseRate: 12.00,
        ratePerWeight: 1.20,
        ratePerVolume: 2.50,
        minCharge: 15.00,
        transitDays: 3,
      };

      const config = service.createConfig(createDto);

      expect(config).toBeDefined();
      expect(config.carrierType).toBe('DHL');
      expect(config.id).toBeDefined();
      expect(config.isActive).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update existing configuration', () => {
      const updateDto = {
        baseRate: 9.00,
      };

      const config = service.updateConfig('ups-ground', updateDto);

      expect(config).toBeDefined();
      expect(config.baseRate).toBe(9.00);
    });

    it('should throw error for non-existent configuration', () => {
      expect(() => {
        service.updateConfig('non-existent', { baseRate: 10 });
      }).toThrow();
    });
  });

  describe('calculateShippingCost', () => {
    it('should calculate shipping cost correctly', () => {
      const cost = service.calculateShippingCost('ups-ground', 5, 2, false);

      expect(cost).toBeDefined();
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThan(0);
    });

    it('should apply weekend surcharge when applicable', () => {
      const regularCost = service.calculateShippingCost('ups-2day', 5, 2, false);
      const weekendCost = service.calculateShippingCost('ups-2day', 5, 2, true);

      expect(weekendCost).toBeGreaterThan(regularCost);
    });

    it('should apply minimum charge', () => {
      const cost = service.calculateShippingCost('ups-ground', 0.1, 0.1, false);

      expect(cost).toBeGreaterThanOrEqual(10.00); // minCharge
    });
  });

  describe('getBestShippingOption', () => {
    it('should return best shipping option', () => {
      const option = service.getBestShippingOption(5, 2);

      expect(option).toBeDefined();
      expect(option?.isActive).toBe(true);
    });

    it('should filter by max transit days', () => {
      const option = service.getBestShippingOption(5, 2, 2); // Max 2 days

      expect(option).toBeDefined();
      if (option) {
        expect(option.transitDays).toBeLessThanOrEqual(2);
      }
    });

    it('should filter by weekend delivery requirement', () => {
      const option = service.getBestShippingOption(5, 2, undefined, true);

      expect(option).toBeDefined();
      if (option) {
        expect(option.supportsWeekendDelivery).toBe(true);
      }
    });

    it('should return null if no options match', () => {
      const option = service.getBestShippingOption(5, 2, 0); // Impossible requirement

      expect(option).toBeNull();
    });
  });

  describe('toggleConfigStatus', () => {
    it('should toggle configuration status', () => {
      const config = service.toggleConfigStatus('ups-ground', false);

      expect(config.isActive).toBe(false);

      const reactivated = service.toggleConfigStatus('ups-ground', true);
      expect(reactivated.isActive).toBe(true);
    });
  });

  describe('getFreightStatistics', () => {
    it('should get freight statistics', async () => {
      const mockBookings = [
        { id: '1', carrier: 'UPS' },
        { id: '2', carrier: 'FedEx' },
        { id: '3', carrier: 'UPS' },
      ];

      mockFreightBookingRepository.find.mockResolvedValue(mockBookings);

      const stats = await service.getFreightStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalBookings).toBe(3);
      expect(stats.carriers).toBeDefined();
      expect(stats.carriers['UPS']).toBe(2);
      expect(stats.carriers['FedEx']).toBe(1);
    });
  });
});
