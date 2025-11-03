import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface Customer {
  id?: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  showCreateForm = false;
  showEditForm = false;
  error: string | null = null;
  loading = false;

  newCustomer: Customer = {
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  };

  editingCustomer: Customer | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.apiService.get<Customer[]>('/customers').subscribe({
      next: (data) => {
        this.customers = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load customers';
        console.error('Error loading customers:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  showCreate(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.newCustomer = { name: '', contactEmail: '', contactPhone: '', address: '' };
    this.error = null;
  }

  showEdit(customer: Customer): void {
    this.showEditForm = true;
    this.showCreateForm = false;
    this.editingCustomer = { ...customer };
    this.error = null;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editingCustomer = null;
    this.error = null;
  }

  createCustomer(): void {
    if (!this.newCustomer.name || !this.newCustomer.contactEmail) {
      this.error = 'Name and email are required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.post<Customer>('/customers', this.newCustomer).subscribe({
      next: (data) => {
        this.customers.push(data);
        this.cancelForm();
        alert('Customer created successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create customer';
        console.error('Error creating customer:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  updateCustomer(): void {
    if (!this.editingCustomer?.name || !this.editingCustomer?.contactEmail) {
      this.error = 'Name and email are required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.patch<Customer>(`/customers/${this.editingCustomer.id}`, this.editingCustomer).subscribe({
      next: (data) => {
        const index = this.customers.findIndex(c => c.id === this.editingCustomer!.id);
        if (index !== -1) {
          this.customers[index] = data;
        }
        this.cancelForm();
        alert('Customer updated successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update customer';
        console.error('Error updating customer:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return;
    }

    this.loading = true;
    this.apiService.delete(`/customers/${customer.id}`).subscribe({
      next: () => {
        this.customers = this.customers.filter(c => c.id !== customer.id);
        alert('Customer deleted successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete customer';
        console.error('Error deleting customer:', err);
        alert(`Failed to delete customer: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  toggleActive(customer: Customer): void {
    const updateData = { isActive: !customer.isActive };

    this.loading = true;
    this.apiService.patch<Customer>(`/customers/${customer.id}`, updateData).subscribe({
      next: (data) => {
        customer.isActive = data.isActive;
        alert('Customer status updated!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update customer status';
        console.error('Error updating customer status:', err);
        alert(`Failed to update customer status: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}

