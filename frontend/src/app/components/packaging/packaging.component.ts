import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface Shipment {
  id?: string;
  customer?: any;
  totalQuantity?: number;
  status?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-packaging',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, DatePipe],
  templateUrl: './packaging.component.html',
  styleUrls: ['./packaging.component.css']
})
export class PackagingComponent implements OnInit {
  shipments: Shipment[] = [];
  error: string | null = null;
  loading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadShipments();
  }

  loadShipments(): void {
    this.loading = true;
    this.apiService.get<Shipment[]>('/packaging/ready').subscribe({
      next: (data) => {
        this.shipments = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load ready shipments';
        console.error('Error loading ready shipments:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  packageShipment(shipment: Shipment): void {
    if (!confirm('Are you sure you want to package and ship this shipment?')) {
      return;
    }

    this.loading = true;
    this.apiService.patch<any>(`/packaging/${shipment.id}/package`, {
      autoBookFreight: false
    }).subscribe({
      next: () => {
        this.loadShipments();
        alert('Shipment packaged successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to package shipment';
        console.error('Error packaging shipment:', err);
        alert(`Failed to package shipment: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
