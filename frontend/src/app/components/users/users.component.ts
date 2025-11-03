import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface User {
  id?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  customerId?: string;
  customer?: any;
  isActive?: boolean;
}

interface Customer {
  id: string;
  name: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  customers: Customer[] = [];
  showCreateForm = false;
  showEditForm = false;
  error: string | null = null;
  loading = false;

  roles = [
    'Super Admin',
    'Inventory Leader',
    'Receiving',
    'Picking',
    'Delivery Leader',
    'QC',
    'Packaging',
    'Customer'
  ];

  newUser: User = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Picking',
    customerId: ''
  };

  editingUser: User | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      users: this.apiService.get<User[]>('/users'),
      customers: this.apiService.get<Customer[]>('/customers')
    }).subscribe({
      next: (results) => {
        this.users = results.users;
        this.customers = results.customers;
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
    this.newUser = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'Picking',
      customerId: ''
    };
    this.error = null;
  }

  showEdit(user: User): void {
    this.showEditForm = true;
    this.showCreateForm = false;
    this.editingUser = { ...user };
    this.editingUser.password = '';
    this.error = null;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editingUser = null;
    this.error = null;
  }

  createUser(): void {
    if (!this.newUser.email || !this.newUser.password || !this.newUser.firstName || !this.newUser.lastName) {
      this.error = 'Email, Password, First Name, and Last Name are required';
      return;
    }

    this.loading = true;
    this.error = null;

    const userData: any = { ...this.newUser };
    if (!userData.customerId) {
      delete userData.customerId;
    }

    this.apiService.post<User>('/users', userData).subscribe({
      next: (data) => {
        this.users.push(data);
        this.cancelForm();
        alert('User created successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create user';
        console.error('Error creating user:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  updateUser(): void {
    if (!this.editingUser?.email || !this.editingUser?.firstName || !this.editingUser?.lastName) {
      this.error = 'Email, First Name, and Last Name are required';
      return;
    }

    this.loading = true;
    this.error = null;

    const updateData: any = {
      email: this.editingUser.email,
      firstName: this.editingUser.firstName,
      lastName: this.editingUser.lastName,
      role: this.editingUser.role,
      customerId: this.editingUser.customerId
    };

    if (this.editingUser.password && this.editingUser.password.length > 0) {
      updateData.password = this.editingUser.password;
    }

    this.apiService.patch<User>(`/users/${this.editingUser.id}`, updateData).subscribe({
      next: (data) => {
        const index = this.users.findIndex(u => u.id === this.editingUser!.id);
        if (index !== -1) {
          this.users[index] = data;
        }
        this.cancelForm();
        alert('User updated successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update user';
        console.error('Error updating user:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete user ${user.email}?`)) {
      return;
    }

    this.loading = true;
    this.apiService.delete(`/users/${user.id}`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        alert('User deleted successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete user';
        console.error('Error deleting user:', err);
        alert(`Failed to delete user: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  toggleActive(user: User): void {
    const updateData = { isActive: !user.isActive };

    this.loading = true;
    this.apiService.patch<User>(`/users/${user.id}`, updateData).subscribe({
      next: (data) => {
        user.isActive = data.isActive;
        alert('User status updated!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update user status';
        console.error('Error updating user status:', err);
        alert(`Failed to update user status: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
