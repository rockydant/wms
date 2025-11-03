import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface ShipmentItem {
  sku: string;
  size: string;
  color: string;
  quantity: number;
}

interface Shipment {
  id?: string;
  customerId?: string;
  customer?: any;
  warehouseId?: string;
  warehouse?: any;
  items?: ShipmentItem[];
  totalQuantity?: number;
  fulfilledQuantity?: number;
  status?: string;
  createdAt?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, DatePipe],
  templateUrl: './shipments.component.html',
  styleUrls: ['./shipments.component.css']
})
export class ShipmentsComponent implements OnInit {
  shipments: Shipment[] = [];
  customers: Customer[] = [];
  warehouses: Warehouse[] = [];
  showCreateForm = false;
  showEditForm = false;
  error: string | null = null;
  loading = false;

  statuses = ['Pending', 'Receiving', 'Ready', 'Partially Shipped', 'Shipped'];

  newShipment: Shipment = {
    customerId: '',
    warehouseId: '',
    items: []
  };

  editingShipment: Shipment | null = null;
  currentItem: ShipmentItem = { sku: '', size: '', color: '', quantity: 1 };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      customers: this.apiService.get<Customer[]>('/customers'),
      warehouses: this.apiService.get<Warehouse[]>('/warehouse'),
      shipments: this.apiService.get<Shipment[]>('/shipments')
    }).subscribe({
      next: (results) => {
        this.customers = results.customers;
        this.warehouses = results.warehouses;
        this.shipments = results.shipments;
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
    this.showEditForm = false;
    this.newShipment = {
      customerId: this.customers.length > 0 ? this.customers[0].id : '',
      warehouseId: this.warehouses.length > 0 ? this.warehouses[0].id : '',
      items: []
    };
    this.currentItem = { sku: '', size: '', color: '', quantity: 1 };
    this.error = null;
  }

  showEdit(shipment: Shipment): void {
    this.showEditForm = true;
    this.showCreateForm = false;
    this.editingShipment = { ...shipment };
    this.error = null;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editingShipment = null;
    this.error = null;
  }

  addItem(): void {
    if (!this.currentItem.sku || !this.currentItem.size || !this.currentItem.color || !this.currentItem.quantity) {
      this.error = 'SKU, Size, Color, and Quantity are required';
      return;
    }
    this.newShipment.items!.push({ ...this.currentItem });
    this.currentItem = { sku: '', size: '', color: '', quantity: 1 };
    this.error = null;
  }

  removeItem(index: number): void {
    this.newShipment.items!.splice(index, 1);
  }

  createShipment(): void {
    if (!this.newShipment.customerId || !this.newShipment.items || this.newShipment.items.length === 0) {
      this.error = 'Customer and at least one item are required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.post<Shipment>('/shipments', this.newShipment).subscribe({
      next: (data) => {
        this.shipments.push(data);
        this.cancelForm();
        alert('Shipment created successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create shipment';
        console.error('Error creating shipment:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  updateShipment(): void {
    if (!this.editingShipment) return;

    this.loading = true;
    this.error = null;

    this.apiService.patch<Shipment>(`/shipments/${this.editingShipment.id}`, this.editingShipment).subscribe({
      next: (data) => {
        const index = this.shipments.findIndex(s => s.id === this.editingShipment!.id);
        if (index !== -1) {
          this.shipments[index] = data;
        }
        this.cancelForm();
        alert('Shipment updated successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update shipment';
        console.error('Error updating shipment:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  deleteShipment(shipment: Shipment): void {
    if (!confirm('Are you sure you want to delete this shipment?')) {
      return;
    }

    this.loading = true;
    this.apiService.delete(`/shipments/${shipment.id}`).subscribe({
      next: () => {
        this.shipments = this.shipments.filter(s => s.id !== shipment.id);
        alert('Shipment deleted successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete shipment';
        console.error('Error deleting shipment:', err);
        alert(`Failed to delete shipment: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  updateStatus(shipment: Shipment, status: string): void {
    this.loading = true;
    this.apiService.patch<Shipment>(`/shipments/${shipment.id}/status`, { status }).subscribe({
      next: (data) => {
        shipment.status = data.status;
        alert('Status updated successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update status';
        console.error('Error updating status:', err);
        alert(`Failed to update status: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Receiving': return 'bg-blue-100 text-blue-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Partially Shipped': return 'bg-orange-100 text-orange-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
