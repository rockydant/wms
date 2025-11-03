import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    loadComponent: () => import('./components/customers/customers.component').then(m => m.CustomersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'shipments',
    loadComponent: () => import('./components/shipments/shipments.component').then(m => m.ShipmentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadComponent: () => import('./components/inventory/inventory.component').then(m => m.InventoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'receiving',
    loadComponent: () => import('./components/receiving/receiving.component').then(m => m.ReceivingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'picking',
    loadComponent: () => import('./components/picking/picking.component').then(m => m.PickingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'qc',
    loadComponent: () => import('./components/qc/qc.component').then(m => m.QcComponent),
    canActivate: [authGuard]
  },
  {
    path: 'packaging',
    loadComponent: () => import('./components/packaging/packaging.component').then(m => m.PackagingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'warehouse',
    loadComponent: () => import('./components/warehouse/warehouse.component').then(m => m.WarehouseComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
