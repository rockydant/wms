import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface Shipment {
  id: string;
  customer?: any;
  totalQuantity?: number;
}

interface PickingQueue {
  id?: string;
  shipmentId?: string;
  priority?: string;
  status?: string;
  orderType?: string;
  area?: string;
  pickingItems?: any[];
  route?: any;
}

@Component({
  selector: 'app-picking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './picking.component.html',
  styleUrls: ['./picking.component.css']
})
export class PickingComponent implements OnInit {
  orderQueues: PickingQueue[] = [];
  shipments: Shipment[] = [];
  showCreateForm = false;
  showDetailsForm = false;
  error: string | null = null;
  loading = false;
  optimizedRoute: any = null;

  newQueue: PickingQueue = { shipmentId: '' };
  selectedQueue: PickingQueue | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      shipments: this.apiService.get<Shipment[]>('/shipments?status=Ready'),
      queues: this.apiService.get<PickingQueue[]>('/picking/queues')
    }).subscribe({
      next: (results) => {
        this.shipments = results.shipments;
        this.orderQueues = results.queues;
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
    this.newQueue = { shipmentId: this.shipments.length > 0 ? this.shipments[0].id : '' };
    this.error = null;
  }

  showDetails(queue: PickingQueue): void {
    this.showDetailsForm = true;
    this.showCreateForm = false;
    this.selectedQueue = queue;
    this.optimizedRoute = null;
    this.error = null;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.showDetailsForm = false;
    this.selectedQueue = null;
    this.optimizedRoute = null;
    this.error = null;
  }

  createQueue(): void {
    if (!this.newQueue.shipmentId) {
      this.error = 'Please select a shipment';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.post<PickingQueue>('/picking/queues', { shipmentId: this.newQueue.shipmentId }).subscribe({
      next: (data) => {
        this.orderQueues.push(data);
        this.cancelForm();
        alert('Picking queue created successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create picking queue';
        console.error('Error creating picking queue:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getOptimizedRoute(queue: PickingQueue): void {
    this.loading = true;
    this.apiService.get(`/picking/queues/${queue.id}/route`).subscribe({
      next: (data) => {
        this.optimizedRoute = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to get optimized route';
        console.error('Error getting optimized route:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  assignQueue(queue: PickingQueue): void {
    this.loading = true;
    this.apiService.patch<PickingQueue>(`/picking/queues/${queue.id}/assign`, {}).subscribe({
      next: (data) => {
        queue.status = 'In Progress';
        Object.assign(queue, data);
        alert('Queue assigned to you successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to assign queue';
        console.error('Error assigning queue:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  completePicking(queue: PickingQueue): void {
    if (!confirm('Are you sure you want to mark this queue as completed?')) {
      return;
    }

    this.loading = true;
    this.apiService.patch<PickingQueue>(`/picking/queues/${queue.id}/complete`, {}).subscribe({
      next: (data) => {
        queue.status = 'Completed';
        Object.assign(queue, data);
        alert('Picking completed successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to complete picking';
        console.error('Error completing picking:', err);
        alert(`Failed to complete picking: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getPriorityClass(priority?: string): string {
    switch (priority) {
      case 'FIFO': return 'bg-blue-100 text-blue-800';
      case 'Rush': return 'bg-red-100 text-red-800';
      case 'Regular': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
