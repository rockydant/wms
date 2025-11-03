import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LayoutComponent } from './components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardComponent
      },
      {
        path: 'customers',
        loadComponent: () => import('./components/customers/customers.component').then(m => m.CustomersComponent)
      },
      {
        path: 'shipments',
        loadComponent: () => import('./components/shipments/shipments.component').then(m => m.ShipmentsComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./components/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'receiving',
        loadComponent: () => import('./components/receiving/receiving.component').then(m => m.ReceivingComponent)
      },
      {
        path: 'picking',
        loadComponent: () => import('./components/picking/picking.component').then(m => m.PickingComponent)
      },
      {
        path: 'qc',
        loadComponent: () => import('./components/qc/qc.component').then(m => m.QcComponent)
      },
      {
        path: 'packaging',
        loadComponent: () => import('./components/packaging/packaging.component').then(m => m.PackagingComponent)
      },
      {
        path: 'warehouse',
        loadComponent: () => import('./components/warehouse/warehouse.component').then(m => m.WarehouseComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
