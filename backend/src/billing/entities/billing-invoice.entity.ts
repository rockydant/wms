import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { BillingInvoiceItem } from './billing-invoice-item.entity';

export enum InvoiceStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
}

export enum BillingType {
  STORAGE = 'Storage',
  FULFILLMENT = 'Fulfillment',
  SHIPMENT = 'Shipment',
  CUBIC_FEET = 'Cubic Feet',
  ORDER_COUNT = 'Order Count',
}

@Entity('billing_invoices')
export class BillingInvoice extends BaseEntity {
  @Column()
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ unique: true })
  invoiceNumber: string; // Auto-generated invoice number

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  dueDate?: Date;

  @Column({ nullable: true })
  paidDate?: Date;

  @Column({ nullable: true })
  billingPeriodStart?: Date;

  @Column({ nullable: true })
  billingPeriodEnd?: Date;

  @Column({ type: 'varchar', array: true, default: [] })
  billingTypes: BillingType[]; // Types of charges included

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => BillingInvoiceItem, (item) => item.invoice, { cascade: true })
  items: BillingInvoiceItem[];
}
