import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NavbarComponent } from '../navbar/navbar.component';

interface Warehouse {
  id?: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface Location {
  id?: string;
  warehouseId: string;
  area: string;
  column: string;
  rack: string;
  bin: string;
  maxCapacity?: number;
  locationCode?: string;
}

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.css']
})
export class WarehouseComponent implements OnInit {
  locations: Location[] = [];
  warehouses: Warehouse[] = [];
  heatmapData: any[] = [];
  showCreateWarehouseForm = false;
  showCreateLocationForm = false;
  showWarehouseDetailsForm = false;
  selectedWarehouse: Warehouse | null = null;
  error: string | null = null;
  loading = false;

  newWarehouse: Warehouse = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    contactPhone: '',
    contactEmail: ''
  };

  newLocation: Location = {
    warehouseId: '',
    area: '',
    column: '',
    rack: '',
    bin: '',
    maxCapacity: 100
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      warehouses: this.apiService.get<Warehouse[]>('/warehouse').pipe(catchError(() => of([]))),
      locations: this.apiService.get<Location[]>('/warehouse/locations').pipe(catchError(() => of([]))),
      heatmap: this.apiService.get<any[]>('/warehouse/heatmap').pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.warehouses = results.warehouses;
        this.locations = results.locations;
        this.heatmapData = results.heatmap;
        if (this.warehouses.length > 0 && !this.newLocation.warehouseId) {
          this.newLocation.warehouseId = this.warehouses[0].id!;
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

  showCreateWarehouse(): void {
    this.showCreateWarehouseForm = true;
    this.newWarehouse = {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      contactPhone: '',
      contactEmail: ''
    };
    this.error = null;
  }

  showCreateLocation(): void {
    this.showCreateLocationForm = true;
    this.newLocation = {
      warehouseId: this.warehouses.length > 0 ? this.warehouses[0].id! : '',
      area: '',
      column: '',
      rack: '',
      bin: '',
      maxCapacity: 100
    };
    this.error = null;
  }

  showWarehouseDetails(warehouse: Warehouse): void {
    this.showWarehouseDetailsForm = true;
    this.selectedWarehouse = warehouse;
    this.error = null;
  }

  cancelForm(): void {
    this.showCreateWarehouseForm = false;
    this.showCreateLocationForm = false;
    this.showWarehouseDetailsForm = false;
    this.selectedWarehouse = null;
    this.error = null;
  }

  createWarehouse(): void {
    if (!this.newWarehouse.name) {
      this.error = 'Warehouse name is required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.post<Warehouse>('/warehouse', this.newWarehouse).subscribe({
      next: (data) => {
        this.warehouses.push(data);
        this.cancelForm();
        alert('Warehouse created successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create warehouse';
        console.error('Error creating warehouse:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  createLocation(): void {
    if (!this.newLocation.warehouseId || !this.newLocation.area || !this.newLocation.column || !this.newLocation.rack || !this.newLocation.bin) {
      this.error = 'Warehouse, Area, Column, Rack, and Bin are required';
      return;
    }

    this.loading = true;
    this.error = null;

    this.apiService.post<Location>('/warehouse/locations', this.newLocation).subscribe({
      next: (data) => {
        this.locations.push(data);
        this.cancelForm();
        this.loadHeatmap();
        alert('Location created successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create location';
        console.error('Error creating location:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  deleteLocation(location: Location): void {
    if (!confirm(`Are you sure you want to delete location ${location.locationCode}?`)) {
      return;
    }

    this.loading = true;
    this.apiService.delete(`/warehouse/locations/${location.id}`).subscribe({
      next: () => {
        this.locations = this.locations.filter(l => l.id !== location.id);
        this.loadHeatmap();
        alert('Location deleted successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete location';
        console.error('Error deleting location:', err);
        alert(`Failed to delete location: ${this.error || 'Unknown error'}`);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  loadHeatmap(): void {
    this.apiService.get<any[]>('/warehouse/heatmap').pipe(catchError(() => of([]))).subscribe({
      next: (data) => {
        this.heatmapData = data;
      },
      error: () => {
        // Silent error - heatmap is optional
      }
    });
  }

  refreshHeatmap(): void {
    if (!this.warehouses.length) {
      alert('Please create a warehouse first');
      return;
    }
    this.loading = true;
    this.apiService.patch(`/warehouse/heatmap/${this.warehouses[0].id}/refresh`, {}).subscribe({
      next: () => {
        this.loadHeatmap();
        alert('Heatmap refreshed successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to refresh heatmap';
        console.error('Error refreshing heatmap:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
