import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface QCItem {
  id?: string;
  queueId?: string;
  queue?: any;
  inventoryItem?: any;
  verified?: boolean;
}

interface VerificationData {
  queueId: string;
  itemId: string;
  inventoryBarcode: string;
  pickingBarcode: string;
}

@Component({
  selector: 'app-qc',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './qc.component.html',
  styleUrls: ['./qc.component.css']
})
export class QcComponent implements OnInit {
  orderQueues: any[] = [];
  items: QCItem[] = [];
  showVerifyForm = false;
  selectedQueue: any = null;
  error: string | null = null;
  loading = false;

  verificationData: VerificationData = {
    queueId: '',
    itemId: '',
    inventoryBarcode: '',
    pickingBarcode: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.apiService.get<any[]>('/picking/queues').subscribe({
      next: (data) => {
        this.orderQueues = data;
        this.items = [];
        data.forEach(queue => {
          if (queue.pickingItems && queue.pickingItems.length > 0) {
            this.items = this.items.concat(queue.pickingItems.map((item: any) => {
              item.queue = queue;
              return item;
            }));
          }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load QC items';
        console.error('Error loading QC items:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  showVerify(item: QCItem): void {
    this.showVerifyForm = true;
    this.verificationData = {
      queueId: item.queueId || item.queue?.id || '',
      itemId: item.id || '',
      inventoryBarcode: item.inventoryItem?.inventoryBarcode || '',
      pickingBarcode: item.inventoryItem?.pickingBarcode || ''
    };
    this.error = null;
  }

  cancelForm(): void {
    this.showVerifyForm = false;
    this.error = null;
  }

  verifyItem(): void {
    if (!this.verificationData.inventoryBarcode || !this.verificationData.pickingBarcode) {
      this.error = 'Both barcodes are required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.patch<any>('/qc/verify', this.verificationData).subscribe({
      next: (data) => {
        if (data && data.verified) {
          const item = this.items.find(i => i.id === this.verificationData.itemId);
          if (item) {
            item.verified = true;
          }
          this.cancelForm();
          alert('Item verified successfully!');
        } else {
          this.error = 'Verification failed - barcodes do not match';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to verify item';
        console.error('Error verifying item:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  isQueueVerified(queue: any): boolean {
    return queue.pickingItems && queue.pickingItems.every((item: any) => item.verified);
  }

  completeQC(queue: any): void {
    if (!confirm('Are you sure you want to mark this queue as QC completed?')) {
      return;
    }

    this.loading = true;
    this.apiService.patch<any>('/qc/complete', {
      queueId: queue.id,
      shipmentId: queue.shipmentId
    }).subscribe({
      next: () => {
        this.loadData();
        alert('QC completed successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to complete QC';
        console.error('Error completing QC:', err);
        alert(`Failed to complete QC: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
