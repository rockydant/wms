import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any = null;
  loading = true;
  error: string | null = null;
  inventorySummary = { total: 0, ready: 0 };
  recentShipments: any[] = [];
  dashboardData: any = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Try to load dashboard endpoint first
    this.apiService.get<any>('/dashboard').pipe(
      catchError(() => of(null))
    ).subscribe({
      next: (data) => {
        if (data) {
          this.dashboardData = data;
          if (data.overview?.inventory) {
            this.inventorySummary = {
              total: data.overview.inventory.total || 0,
              ready: data.overview.inventory.ready || 0
            };
          }
          if (data.overview?.shipments) {
            // Load actual shipments
            this.loadRecentShipments();
          }
        } else {
          // Fallback: load individual endpoints
          this.loadFallbackData();
        }
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loadFallbackData();
      }
    });
  }

  loadFallbackData(): void {
    forkJoin({
      shipments: this.apiService.get<any[]>('/shipments').pipe(catchError(() => of([]))),
      inventory: this.apiService.get<any[]>('/inventory').pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.recentShipments = (results.shipments || []).slice(0, 5);
        const inventory = results.inventory || [];
        this.inventorySummary = {
          total: inventory.length,
          ready: inventory.filter((item: any) => item.status === 'Ready').length
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }

  loadRecentShipments(): void {
    this.apiService.get<any[]>('/shipments').pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (shipments) => {
        this.recentShipments = shipments.slice(0, 5);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
