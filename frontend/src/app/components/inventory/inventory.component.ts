import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface InventoryItem {
  id?: string;
  customerId?: string;
  customer?: any;
  sku: string;
  size: string;
  color: string;
  locationId?: string;
  status?: string;
  inventoryBarcode?: string;
}

interface InventorySummary {
  sku: string;
  total: number;
  byStatus: { [key: string]: number };
  byVariant: Array<{ size: string; color: string; count: number }>;
}

interface Customer {
  id: string;
  name: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];
  customers: Customer[] = [];
  inventorySummary: InventorySummary[] = [];
  showCreateForm = false;
  showEditForm = false;
  showSummaryView = false;
  error: string | null = null;
  loading = false;
  selectedCustomerId = '';
  quantity = 1;

  newItem: InventoryItem = {
    customerId: '',
    sku: '',
    size: '',
    color: '',
    locationId: ''
  };

  editingItem: InventoryItem | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      customers: this.apiService.get<Customer[]>('/customers'),
      inventory: this.apiService.get<InventoryItem[]>('/inventory')
    }).subscribe({
      next: (results) => {
        this.customers = results.customers;
        this.inventoryItems = results.inventory;
        if (this.customers.length > 0 && !this.selectedCustomerId) {
          this.selectedCustomerId = this.customers[0].id;
        }
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

  filterByCustomer(): void {
    if (this.selectedCustomerId) {
      this.loading = true;
      this.apiService.get<InventoryItem[]>(`/inventory?customerId=${this.selectedCustomerId}`).subscribe({
        next: (data) => {
          this.inventoryItems = data;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to filter inventory';
          console.error('Error filtering inventory:', err);
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.loadInventory();
    }
  }

  loadInventory(): void {
    this.loading = true;
    this.apiService.get<InventoryItem[]>('/inventory').subscribe({
      next: (data) => {
        this.inventoryItems = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load inventory';
        console.error('Error loading inventory:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  showCreate(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.newItem = {
      customerId: this.selectedCustomerId || (this.customers.length > 0 ? this.customers[0].id : ''),
      sku: '',
      size: '',
      color: '',
      locationId: ''
    };
    this.quantity = 1;
    this.error = null;
  }

  showEdit(item: InventoryItem): void {
    this.showEditForm = true;
    this.showCreateForm = false;
    this.editingItem = { ...item };
    this.error = null;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editingItem = null;
    this.error = null;
  }

  createItem(): void {
    if (!this.newItem.customerId || !this.newItem.sku || !this.newItem.size || !this.newItem.color) {
      this.error = 'Customer, SKU, Size, and Color are required';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.quantity > 1) {
      // Bulk create
      this.apiService.post<InventoryItem[]>('/inventory/bulk', {
        item: this.newItem,
        quantity: this.quantity
      }).subscribe({
        next: (data) => {
          this.inventoryItems = [...data, ...this.inventoryItems];
          this.cancelForm();
          alert(`Created ${data.length} inventory items successfully!`);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create inventory items';
          console.error('Error creating inventory items:', err);
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Single item create
      this.apiService.post<InventoryItem>('/inventory', this.newItem).subscribe({
        next: (data) => {
          this.inventoryItems.push(data);
          this.cancelForm();
          alert('Inventory item created successfully!');
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create inventory item';
          console.error('Error creating inventory item:', err);
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  updateItem(): void {
    if (!this.editingItem?.customerId || !this.editingItem?.sku || !this.editingItem?.size || !this.editingItem?.color) {
      this.error = 'Customer, SKU, Size, and Color are required';
      return;
    }

    this.loading = true;
    this.error = null;

    const updateData = {
      customerId: this.editingItem.customerId,
      sku: this.editingItem.sku,
      size: this.editingItem.size,
      color: this.editingItem.color,
      locationId: this.editingItem.locationId
    };

    this.apiService.patch<InventoryItem>(`/inventory/${this.editingItem.id}`, updateData).subscribe({
      next: (data) => {
        const index = this.inventoryItems.findIndex(i => i.id === this.editingItem!.id);
        if (index !== -1) {
          this.inventoryItems[index] = data;
        }
        this.cancelForm();
        alert('Inventory item updated successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update inventory item';
        console.error('Error updating inventory item:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  deleteItem(item: InventoryItem): void {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    this.loading = true;
    this.apiService.delete(`/inventory/${item.id}`).subscribe({
      next: () => {
        this.inventoryItems = this.inventoryItems.filter(i => i.id !== item.id);
        alert('Inventory item deleted successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete inventory item';
        console.error('Error deleting inventory item:', err);
        alert(`Failed to delete inventory item: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  toggleSummaryView(): void {
    this.showSummaryView = !this.showSummaryView;
    if (this.showSummaryView) {
      this.loadSummary();
    }
  }

  loadSummary(): void {
    this.loading = true;
    let url = '/inventory/summary/by-sku';
    if (this.selectedCustomerId) {
      url += `?customerId=${this.selectedCustomerId}`;
    }
    
    this.apiService.get<InventorySummary[]>(url).subscribe({
      next: (data) => {
        this.inventorySummary = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load inventory summary';
        console.error('Error loading inventory summary:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'In Transit': return 'bg-gray-100 text-gray-800';
      case 'Received': return 'bg-yellow-100 text-yellow-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Picked': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusEntries(statusObj: { [key: string]: number }): Array<{key: string, value: number}> {
    return Object.keys(statusObj).map(key => ({ key, value: statusObj[key] }));
  }
}
