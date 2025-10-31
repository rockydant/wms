import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: Repository<Customer>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      const createDto = {
        name: 'Test Customer',
        contactEmail: 'test@example.com',
        apiKey: 'test-api-key',
      };

      const mockCustomer = {
        id: '1',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockCustomer);
      mockRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return all customers', async () => {
      const mockCustomers = [
        { id: '1', name: 'Customer 1', contactEmail: 'c1@example.com' },
        { id: '2', name: 'Customer 2', contactEmail: 'c2@example.com' },
      ];

      mockRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.findAll();

      expect(result).toEqual(mockCustomers);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = {
        id: '1',
        name: 'Test Customer',
        contactEmail: 'test@example.com',
      };

      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const updateDto = { name: 'Updated Customer' };
      const mockCustomer = {
        id: '1',
        name: 'Updated Customer',
        contactEmail: 'test@example.com',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateDto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('remove', () => {
    it('should soft delete a customer', async () => {
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
