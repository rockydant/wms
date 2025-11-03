import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface Customer {
  id: string;
  name: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  receivingReport: any = null;
  pickingReport: any = null;
  shipmentReport: any = null;
  executiveInsights: any = null;
  financialSummary: any = null;
  departmentPerformance: any = null;
  realtimeDashboard: any = null;
  customers: Customer[] = [];
  selectedCustomerId = '';
  reportDate = new Date().toISOString().split('T')[0];
  startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  endDate = new Date().toISOString().split('T')[0];
  loading = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadReports();
  }

  loadCustomers(): void {
    this.apiService.get<Customer[]>('/customers').pipe(catchError(() => of([]))).subscribe({
      next: (data) => {
        this.customers = data;
      }
    });
  }

  loadReports(): void {
    this.loading = true;
    forkJoin({
      receiving: this.apiService.get(`/reports/receiving/daily?date=${this.reportDate}`).pipe(catchError(() => of(null))),
      picking: this.apiService.get(`/reports/picking/daily?date=${this.reportDate}`).pipe(catchError(() => of(null))),
      shipments: this.apiService.get(`/reports/shipments/daily?date=${this.reportDate}`).pipe(catchError(() => of(null)))
    }).subscribe({
      next: (results) => {
        this.receivingReport = results.receiving;
        this.pickingReport = results.picking;
        this.shipmentReport = results.shipments;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  loadExecutiveInsights(): void {
    this.loading = true;
    let url = `/reports/insights/executive?startDate=${this.startDate}&endDate=${this.endDate}`;
    if (this.selectedCustomerId) {
      url += `&customerId=${this.selectedCustomerId}`;
    }
    
    this.apiService.get(url).subscribe({
      next: (data) => {
        this.executiveInsights = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load executive insights';
        console.error('Error loading executive insights:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  loadFinancialSummary(): void {
    this.loading = true;
    let url = `/reports/insights/financial?startDate=${this.startDate}&endDate=${this.endDate}`;
    if (this.selectedCustomerId) {
      url += `&customerId=${this.selectedCustomerId}`;
    }
    
    this.apiService.get(url).subscribe({
      next: (data) => {
        this.financialSummary = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load financial summary';
        console.error('Error loading financial summary:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  loadDepartmentPerformance(): void {
    this.loading = true;
    let url = `/reports/performance/departments?startDate=${this.startDate}&endDate=${this.endDate}`;
    if (this.selectedCustomerId) {
      url += `&customerId=${this.selectedCustomerId}`;
    }
    
    this.apiService.get(url).subscribe({
      next: (data) => {
        this.departmentPerformance = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load department performance';
        console.error('Error loading department performance:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  loadRealtimeDashboard(): void {
    this.loading = true;
    this.apiService.get('/dashboard/realtime-operations').subscribe({
      next: (data) => {
        this.realtimeDashboard = data;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load realtime dashboard';
        console.error('Error loading realtime dashboard:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onDateChange(): void {
    this.loadReports();
  }
}
