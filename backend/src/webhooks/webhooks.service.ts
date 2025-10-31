import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { Webhook, WebhookEvent, WebhookStatus } from './entities/webhook.entity';
import { WebhookLog, WebhookLogStatus } from './entities/webhook-log.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private webhookLogRepository: Repository<WebhookLog>,
    @InjectQueue('webhooks')
    private webhookQueue: Queue,
    private httpService: HttpService,
  ) {}

  async create(createDto: CreateWebhookDto): Promise<Webhook> {
    // Generate secret if not provided
    const secret = createDto.secret || this.generateSecret();

    const webhook = this.webhookRepository.create({
      ...createDto,
      secret,
      status: WebhookStatus.ACTIVE,
    });

    return this.webhookRepository.save(webhook);
  }

  async findAll(customerId?: string): Promise<Webhook[]> {
    const where = customerId ? { customerId } : {};
    return this.webhookRepository.find({
      where,
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }
    return webhook;
  }

  async findByCustomer(customerId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { customerId, status: WebhookStatus.ACTIVE },
      relations: ['customer'],
    });
  }

  async update(id: string, updateDto: UpdateWebhookDto): Promise<Webhook> {
    await this.webhookRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.webhookRepository.softDelete(id);
  }

  /**
   * Trigger webhook for an event
   */
  async triggerWebhook(
    customerId: string,
    event: WebhookEvent,
    payload: any,
  ): Promise<void> {
    const webhooks = await this.findByCustomer(customerId);

    for (const webhook of webhooks) {
      if (webhook.events.includes(event)) {
        await this.sendWebhook(webhook, event, payload);
      }
    }
  }

  /**
   * Send webhook asynchronously via queue
   */
  async queueWebhook(webhookId: string, event: WebhookEvent, payload: any): Promise<void> {
    await this.webhookQueue.add('send-webhook', {
      webhookId,
      event,
      payload,
    });
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: any,
  ): Promise<void> {
    const log = this.webhookLogRepository.create({
      webhookId: webhook.id,
      event,
      payload: JSON.stringify(payload),
      status: WebhookLogStatus.PENDING,
    });

    await this.webhookLogRepository.save(log);

    try {
      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret || '');

      const response = await firstValueFrom(
        this.httpService.post(webhook.url, payload, {
          headers: {
            'X-Webhook-Event': event,
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': Date.now().toString(),
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }),
      ).catch((error) => {
        throw error;
      });

      // Success
      log.status = WebhookLogStatus.SUCCESS;
      log.responseCode = response.status;
      log.responseBody = JSON.stringify(response.data);

      webhook.successCount += 1;
      webhook.lastTriggeredAt = new Date();
      await this.webhookRepository.save(webhook);
    } catch (error: any) {
      // Failure
      log.status = WebhookLogStatus.FAILED;
      log.responseCode = error.response?.status;
      log.responseBody = error.response?.data ? JSON.stringify(error.response.data) : undefined;
      log.errorMessage = error.message;
      log.retryCount += 1;

      webhook.failureCount += 1;
      webhook.lastFailedAt = new Date();
      webhook.lastErrorMessage = error.message;

      // If too many failures, mark as inactive
      if (webhook.failureCount >= 10) {
        webhook.status = WebhookStatus.FAILED;
      }

      await this.webhookRepository.save(webhook);
      this.logger.error(`Webhook failed for ${webhook.url}: ${error.message}`);
    }

    await this.webhookLogRepository.save(log);
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get webhook logs
   */
  async getLogs(webhookId: string, limit: number = 50): Promise<WebhookLog[]> {
    return this.webhookLogRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Retry failed webhook
   */
  async retryWebhook(logId: string): Promise<void> {
    const log = await this.webhookLogRepository.findOne({
      where: { id: logId },
      relations: ['webhook'],
    });

    if (!log || log.status === WebhookLogStatus.SUCCESS) {
      return;
    }

    await this.sendWebhook(log.webhook, log.event as WebhookEvent, JSON.parse(log.payload));
  }
}
