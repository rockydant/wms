import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Webhook } from './webhook.entity';

export enum WebhookLogStatus {
  SUCCESS = 'Success',
  FAILED = 'Failed',
  PENDING = 'Pending',
}

@Entity('webhook_logs')
export class WebhookLog extends BaseEntity {
  @Column()
  webhookId: string;

  @ManyToOne(() => Webhook)
  @JoinColumn({ name: 'webhookId' })
  webhook: Webhook;

  @Column()
  event: string; // Event type

  @Column({ type: 'text' })
  payload: string; // JSON payload sent

  @Column({ type: 'enum', enum: WebhookLogStatus, default: WebhookLogStatus.PENDING })
  status: WebhookLogStatus;

  @Column({ type: 'int', nullable: true })
  responseCode?: number; // HTTP response code

  @Column({ type: 'text', nullable: true })
  responseBody?: string; // Response body from webhook endpoint

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  nextRetryAt?: Date;
}
