import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: Registry;

  // HTTP Metrics
  private readonly httpRequestCounter: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestErrors: Counter<string>;

  // Business Metrics
  private readonly shipmentCounter: Counter<string>;
  private readonly inventoryGauge: Gauge<string>;
  private readonly activeUsersGauge: Gauge<string>;

  constructor() {
    this.register = new Registry();

    // HTTP Request Counter
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.register],
    });

    // HTTP Request Duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // HTTP Request Errors
    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'status'],
      registers: [this.register],
    });

    // Shipment Counter
    this.shipmentCounter = new Counter({
      name: 'shipments_total',
      help: 'Total number of shipments',
      labelNames: ['status', 'customer_id'],
      registers: [this.register],
    });

    // Inventory Gauge
    this.inventoryGauge = new Gauge({
      name: 'inventory_items_current',
      help: 'Current number of inventory items',
      labelNames: ['status', 'customer_id'],
      registers: [this.register],
    });

    // Active Users Gauge
    this.activeUsersGauge = new Gauge({
      name: 'active_users_current',
      help: 'Current number of active users',
      labelNames: ['tenant_id'],
      registers: [this.register],
    });
  }

  /**
   * Get metrics registry
   */
  getRegister(): Registry {
    return this.register;
  }

  /**
   * Get metrics as string (Prometheus format)
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, route: string, status: number, duration: number): void {
    this.httpRequestCounter.inc({ method, route, status });
    this.httpRequestDuration.observe({ method, route, status }, duration / 1000);

    if (status >= 400) {
      this.httpRequestErrors.inc({ method, route, status });
    }
  }

  /**
   * Record shipment creation
   */
  recordShipment(status: string, customerId?: string): void {
    this.shipmentCounter.inc({ status, customer_id: customerId || 'unknown' });
  }

  /**
   * Update inventory count
   */
  updateInventoryCount(count: number, status: string, customerId?: string): void {
    this.inventoryGauge.set({ status, customer_id: customerId || 'unknown' }, count);
  }

  /**
   * Update active users count
   */
  updateActiveUsers(count: number, tenantId?: string): void {
    this.activeUsersGauge.set({ tenant_id: tenantId || 'unknown' }, count);
  }
}
