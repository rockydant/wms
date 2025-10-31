import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, SubscriptionPlan, SubscriptionStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async create(createDto: CreateTenantDto): Promise<Tenant> {
    // Check if subdomain already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { subdomain: createDto.subdomain },
    });
    if (existingTenant) {
      throw new BadRequestException('Subdomain already exists');
    }

    const tenant = this.tenantRepository.create({
      ...createDto,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      subscriptionStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    });

    return this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: ['customers', 'users'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['customers', 'users'],
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain },
      relations: ['customers', 'users'],
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with subdomain ${subdomain} not found`);
    }
    return tenant;
  }

  async update(id: string, updateDto: UpdateTenantDto): Promise<Tenant> {
    await this.tenantRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.tenantRepository.softDelete(id);
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    id: string,
    plan: SubscriptionPlan,
    status: SubscriptionStatus,
  ): Promise<Tenant> {
    const tenant = await this.findOne(id);

    tenant.subscriptionPlan = plan;
    tenant.subscriptionStatus = status;

    if (status === SubscriptionStatus.ACTIVE) {
      tenant.subscriptionStartDate = new Date();
      // Set end date based on plan (monthly)
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      tenant.subscriptionEndDate = endDate;
    }

    // Update limits based on plan
    this.updateLimitsByPlan(tenant, plan);

    return this.tenantRepository.save(tenant);
  }

  /**
   * Update tenant limits based on subscription plan
   */
  private updateLimitsByPlan(tenant: Tenant, plan: SubscriptionPlan): void {
    switch (plan) {
      case SubscriptionPlan.FREE:
        tenant.maxUsers = 1;
        tenant.maxWarehouses = 1;
        tenant.maxStorageItems = 100;
        tenant.maxShipmentsPerMonth = 10;
        break;
      case SubscriptionPlan.STARTER:
        tenant.maxUsers = 5;
        tenant.maxWarehouses = 2;
        tenant.maxStorageItems = 5000;
        tenant.maxShipmentsPerMonth = 500;
        break;
      case SubscriptionPlan.PROFESSIONAL:
        tenant.maxUsers = 25;
        tenant.maxWarehouses = 5;
        tenant.maxStorageItems = 50000;
        tenant.maxShipmentsPerMonth = 5000;
        break;
      case SubscriptionPlan.ENTERPRISE:
        tenant.maxUsers = -1; // Unlimited
        tenant.maxWarehouses = -1; // Unlimited
        tenant.maxStorageItems = -1; // Unlimited
        tenant.maxShipmentsPerMonth = -1; // Unlimited
        break;
    }
  }

  /**
   * Check if tenant has reached usage limits
   */
  async checkUsageLimits(tenantId: string, type: 'users' | 'warehouses' | 'storage' | 'shipments'): Promise<boolean> {
    const tenant = await this.findOne(tenantId);

    // Enterprise plan has no limits
    if (tenant.subscriptionPlan === SubscriptionPlan.ENTERPRISE) {
      return true;
    }

    switch (type) {
      case 'users':
        // Would need to count actual users for this tenant
        return true; // Placeholder
      case 'warehouses':
        // Would need to count actual warehouses for this tenant
        return true; // Placeholder
      case 'storage':
        return tenant.maxStorageItems === -1 || tenant.maxStorageItems > 0;
      case 'shipments':
        return tenant.maxShipmentsPerMonth === -1 || tenant.maxShipmentsPerMonth > 0;
      default:
        return true;
    }
  }

  /**
   * Get tenant usage statistics
   */
  async getUsageStats(tenantId: string): Promise<any> {
    const tenant = await this.findOne(tenantId);

    return {
      tenantId: tenant.id,
      plan: tenant.subscriptionPlan,
      status: tenant.subscriptionStatus,
      limits: {
        maxUsers: tenant.maxUsers,
        maxWarehouses: tenant.maxWarehouses,
        maxStorageItems: tenant.maxStorageItems,
        maxShipmentsPerMonth: tenant.maxShipmentsPerMonth,
      },
      usage: {
        // Placeholder - would need actual counts from other modules
        currentUsers: 0,
        currentWarehouses: 0,
        currentStorageItems: 0,
        currentShipmentsThisMonth: 0,
      },
    };
  }
}
