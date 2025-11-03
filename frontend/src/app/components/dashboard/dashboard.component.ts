import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  loading = false;
  error = '';
  inventorySummary: any = { total: 0, ready: 0 };
  recentShipments: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.apiService.get('/dashboard/comprehensive').subscribe({
      next: (data: any) => {
        this.inventorySummary = data.inventorySummary || { total: 0, ready: 0 };
        this.recentShipments = data.recentShipments || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }
}

