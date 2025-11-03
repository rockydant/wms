import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: any = null;
  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
    this.user = this.authService.getCurrentUser();
    
    // Close menu on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileMenuOpen = false;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || (route === '/' && this.router.url === '');
  }

  // Role-based navigation helpers
  hasRole(roles: string[]): boolean {
    if (!this.user) return false;
    return roles.includes(this.user.role);
  }

  isSuperAdmin(): boolean {
    return this.hasRole(['Super Admin']);
  }

  isCustomer(): boolean {
    return this.hasRole(['Customer']);
  }

  canAccessCustomers(): boolean {
    return this.hasRole(['Super Admin']);
  }

  canAccessUsers(): boolean {
    return this.hasRole(['Super Admin']);
  }

  canAccessReceiving(): boolean {
    return this.hasRole(['Super Admin', 'Receiving', 'Inventory Leader', 'Customer']);
  }

  canAccessPicking(): boolean {
    return this.hasRole(['Super Admin', 'Picking', 'Inventory Leader']);
  }

  canAccessQC(): boolean {
    return this.hasRole(['Super Admin', 'QC', 'Delivery Leader']);
  }

  canAccessPackaging(): boolean {
    return this.hasRole(['Super Admin', 'Packaging', 'Delivery Leader']);
  }

  canAccessWarehouse(): boolean {
    return this.hasRole(['Super Admin', 'Inventory Leader']);
  }

  canAccessReports(): boolean {
    return this.hasRole(['Super Admin', 'Inventory Leader', 'Delivery Leader', 'Customer']);
  }

  canAccessInventory(): boolean {
    return this.hasRole(['Super Admin', 'Inventory Leader', 'Receiving', 'Picking', 'Customer']);
  }

  canAccessShipments(): boolean {
    return this.hasRole(['Super Admin', 'Inventory Leader', 'Delivery Leader', 'Packaging', 'Customer']);
  }
}

