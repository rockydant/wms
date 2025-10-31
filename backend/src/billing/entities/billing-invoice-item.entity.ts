import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BillingInvoice } from './billing-invoice.entity';
import { BillingType } from './billing-invoice.entity';

@Entity('billing_invoice_items')
export class BillingInvoiceItem extends BaseEntity {
  @Column()
  invoiceId: string;

  @ManyToOne(() => BillingInvoice, (invoice) => invoice.items)
  @JoinColumn({ name: 'invoiceId' })
  invoice: BillingInvoice;

  @Column({ type: 'enum', enum: BillingType })
  billingType: BillingType;

  @Column()
  description: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // quantity * unitPrice

  @Column({ nullable: true })
  referenceId?: string; // Reference to shipment, storage item, etc.
}
