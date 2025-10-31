import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { TenantsService } from '../tenants/tenants.service';
import { SubscriptionPlan, SubscriptionStatus } from '../tenants/entities/tenant.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private tenantsService: TenantsService,
  ) {}

  async create(createDto: CreateSubscriptionDto): Promise<Subscription> {
    // Verify tenant exists
    await this.tenantsService.findOne(createDto.tenantId);

    const monthlyPrice = this.getPlanPrice(createDto.plan);

    const subscription = this.subscriptionRepository.create({
      ...createDto,
      monthlyPrice,
      status: SubscriptionStatus.TRIAL,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return this.subscriptionRepository.save(subscription);
  }

  async findAll(tenantId?: string): Promise<Subscription[]> {
    const where = tenantId ? { tenantId } : {};
    return this.subscriptionRepository.find({
      where,
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async findByTenant(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateDto: UpdateSubscriptionDto): Promise<Subscription> {
    await this.subscriptionRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.subscriptionRepository.softDelete(id);
  }

  /**
   * Activate subscription
   */
  async activate(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = new Date();
    
    // Set end date based on plan
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    subscription.endDate = endDate;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Cancel subscription
   */
  async cancel(id: string, reason?: string): Promise<Subscription> {
    const subscription = await this.findOne(id);
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;

    return this.subscriptionRepository.save(subscription);
  }

  /**
   * Get plan pricing
   */
  private getPlanPrice(plan: SubscriptionPlan): number {
    const prices: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.STARTER]: 99.0,
      [SubscriptionPlan.PROFESSIONAL]: 299.0,
      [SubscriptionPlan.ENTERPRISE]: 999.0,
    };

    return prices[plan] || 0;
  }

  /**
   * Calculate usage-based billing for a tenant
   */
  async calculateUsageBilling(tenantId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    const subscription = await this.findByTenant(tenantId);
    if (!subscription) {
      return 0;
    }

    // Get tenant usage stats
    const usageStats = await this.tenantsService.getUsageStats(tenantId);
    const limits = usageStats.limits;
    const usage = usageStats.usage;

    let overageCharges = 0;

    // Calculate storage overage
    if (limits.maxStorageItems > 0 && usage.currentStorageItems > limits.maxStorageItems) {
      const overage = usage.currentStorageItems - limits.maxStorageItems;
      overageCharges += overage * 0.01; // $0.01 per item over limit
    }

    // Calculate shipment overage
    if (limits.maxShipmentsPerMonth > 0 && usage.currentShipmentsThisMonth > limits.maxShipmentsPerMonth) {
      const overage = usage.currentShipmentsThisMonth - limits.maxShipmentsPerMonth;
      overageCharges += overage * 2.0; // $2.00 per shipment over limit
    }

    return overageCharges;
  }
}
