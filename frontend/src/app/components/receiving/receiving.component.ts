import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface POItem {
  sku: string;
  size: string;
  color: string;
  expectedQuantity: number;
  receivedQuantity?: number;
}

interface PurchaseOrder {
  id?: string;
  poNumber?: string;
  customerId?: string;
  customer?: any;
  warehouseId?: string;
  warehouse?: any;
  items?: POItem[];
  status?: string;
  createdAt?: string;
  receivedAt?: string;
}

interface Customer {
  id: string;
  name: string;
}

@Component({
  selector: 'app-receiving',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, DatePipe],
  templateUrl: './receiving.component.html',
  styleUrls: ['./receiving.component.css']
})
export class ReceivingComponent implements OnInit {
  purchaseOrders: PurchaseOrder[] = [];
  customers: Customer[] = [];
  showCreateForm = false;
  showDetailsForm = false;
  error: string | null = null;
  loading = false;

  newPO: PurchaseOrder = {
    customerId: '',
    items: []
  };

  currentItem: POItem = { sku: '', size: '', color: '', expectedQuantity: 1 };
  selectedPO: PurchaseOrder | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      customers: this.apiService.get<Customer[]>('/customers'),
      pos: this.apiService.get<PurchaseOrder[]>('/receiving/purchase-orders')
    }).subscribe({
      next: (results) => {
        this.customers = results.customers;
        this.purchaseOrders = results.pos;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load data';
        console.error('Error loading data:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  showCreate(): void {
    this.showCreateForm = true;
    this.showDetailsForm = false;
    this.newPO = {
      customerId: this.customers.length > 0 ? this.customers[0].id : '',
      items: []
    };
    this.currentItem = { sku: '', size: '', color: '', expectedQuantity: 1 };
    this.error = null;
  }

  showDetails(po: PurchaseOrder): void {
    this.showDetailsForm = true;
    this.showCreateForm = false;
    this.selectedPO = po;
    this.error = null;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.showDetailsForm = false;
    this.selectedPO = null;
    this.error = null;
  }

  addItem(): void {
    if (!this.currentItem.sku || !this.currentItem.size || !this.currentItem.color || !this.currentItem.expectedQuantity) {
      this.error = 'SKU, Size, Color, and Expected Quantity are required';
      return;
    }
    this.newPO.items!.push({ ...this.currentItem });
    this.currentItem = { sku: '', size: '', color: '', expectedQuantity: 1 };
    this.error = null;
  }

  removeItem(index: number): void {
    this.newPO.items!.splice(index, 1);
  }

  createPO(): void {
    if (!this.newPO.customerId || !this.newPO.items || this.newPO.items.length === 0) {
      this.error = 'Customer and at least one item are required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.post<PurchaseOrder>('/receiving/purchase-orders', this.newPO).subscribe({
      next: (data) => {
        this.purchaseOrders.push(data);
        this.cancelForm();
        alert('Purchase Order created successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create purchase order';
        console.error('Error creating purchase order:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  completePO(po: PurchaseOrder): void {
    if (!confirm('Are you sure you want to mark this PO as completed?')) {
      return;
    }

    this.loading = true;
    this.apiService.patch<PurchaseOrder>(`/receiving/purchase-orders/${po.id}/complete`, {}).subscribe({
      next: (data) => {
        po.status = 'Completed';
        Object.assign(po, data);
        alert('Purchase Order marked as completed!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to complete purchase order';
        console.error('Error completing purchase order:', err);
        alert(`Failed to complete purchase order: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
