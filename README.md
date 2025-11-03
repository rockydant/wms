# FulfillFlow — Apparel Fulfillment WMS SaaS

FulfillFlow is a cloud-based **Warehouse Management System (WMS)** for apparel and clothing fulfillment centers.  
It digitizes your end-to-end operation: from inbound shipment receiving to order fulfillment and outbound delivery, with customer dashboards and API access.

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Angular 18 + PrimeNG 17 + TailwindCSS (Touch-Optimized) |
| Backend | NestJS (TypeScript, REST & WebSocket) |
| Database | PostgreSQL |
| Queue | BullMQ (Redis) |
| Containerization | Docker + Docker Compose |
| Auth | JWT (Role-based Access Control) |
| Infra | Nginx Reverse Proxy + SSL |

### 📱 Mobile & Touch Optimization

The FulfillFlow UI is fully optimized for touch devices with:
- **Touch-friendly buttons**: 44x44px minimum touch targets (iOS standard)
- **Touch-action optimization**: Prevents double-tap zoom delays
- **Responsive tables**: Horizontal scrolling on mobile devices
- **Mobile-first navigation**: Hamburger menu for mobile view
- **iOS-safe inputs**: 16px font size prevents auto-zoom on focus
- **Touch scrolling**: Smooth momentum scrolling on iOS/Android
- **Responsive grids**: Auto-collapse to single column on mobile

---

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### 1️⃣ Start with Docker Compose

#### Production Build (Nginx + Static Files)
```bash
# Start all services with production build
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

**Note**: The frontend uses a production build with Nginx. It will be available at `http://localhost` (port 80).

#### Development Build (Angular Dev Server)
If you want to use the Angular development server with hot-reload:

```bash
# Use Dockerfile.dev for frontend development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Or manually:
```bash
# Start backend services only
docker-compose up -d postgres redis backend

# Run frontend locally with Angular CLI
cd frontend
npm install
ng serve
```

### 2️⃣ Backend Development

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run migrations (if using TypeORM)
npm run migration:run

# Start development server
npm run start:dev
```

Backend will be available at: `http://localhost:3000`  
API Documentation: `http://localhost:3000/api/docs`

### 3️⃣ Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# or
ng serve
```

Frontend will be available at: `http://localhost:4200`

**Note**: The frontend is built with Angular 18 and uses standalone components. All components are fully implemented and ready for production.

---

## 🔐 Default Credentials

**Initial Setup Required:**

There are no default users created automatically. You need to create the first admin user through the registration API:

```bash
# Register first admin user via API
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fulfillflow.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Super Admin"
  }'
```

**Recommended Default Credentials:**
- **Email:** `admin@fulfillflow.com`
- **Password:** `admin123`
- **Role:** `Super Admin`

⚠️ **IMPORTANT:** Change the default password immediately after first login!

Alternatively, you can use the seed script to create the default admin user:

```bash
# Inside backend container or with npm
cd backend
npm run seed
```

This will create a default admin user with:
- **Email:** `admin@fulfillflow.com`
- **Password:** `admin123`
- **Role:** `Super Admin`

---

## 📁 Project Structure

```
wms/
├── backend/              # NestJS backend application
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── users/        # User management
│   │   ├── customers/   # Customer management
│   │   ├── shipments/   # Shipment management
│   │   ├── inventory/   # Inventory management
│   │   ├── receiving/  # Receiving/Purchase Orders
│   │   ├── picking/     # Picking process
│   │   ├── qc/          # Quality Control
│   │   ├── packaging/   # Packaging process
│   │   ├── warehouse/   # Warehouse layout & heatmap
│   │   └── reports/     # Reporting module
│   └── package.json
├── frontend/             # Angular 18 frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # Angular components (Login, Dashboard, Customers, etc.)
│   │   │   ├── services/   # Angular services (Auth, API)
│   │   │   ├── guards/     # Route guards (Auth)
│   │   │   └── app.routes.ts # Routing configuration
│   │   └── environments/   # Environment configurations
│   └── package.json
└── docker-compose.yml    # Docker orchestration
```

---

## ✅ Implementation Status

### Completed (Phase 1 - Core MVP)

The following features have been fully implemented:

#### Backend Infrastructure
- ✅ **Docker Setup**: Complete Docker Compose configuration with PostgreSQL, Redis, Backend, and Frontend services
- ✅ **NestJS Backend**: Full backend structure with 11 modules
- ✅ **Database**: TypeORM entities for all core models (Users, Customers, Shipments, Inventory, Purchase Orders, Order Queues, Warehouse Locations)
- ✅ **Authentication**: JWT-based auth with 7 role-based access control
- ✅ **API Documentation**: Swagger/OpenAPI integration

#### Core Modules
- ✅ **Users Module**: User management with roles (Super Admin, Inventory Leader, Receiving, Picking, Delivery Leader, QC, Packaging, Customer)
- ✅ **Customers Module**: Customer CRUD operations with API key generation
- ✅ **Shipments Module**: Shipment creation and status tracking (Pending → Receiving → Ready → Shipped)
- ✅ **Inventory Module**: Inventory item management with barcode generation
- ✅ **Receiving Module**: Purchase order creation and receiving process
- ✅ **Picking Module**: Order queue management with priority (FIFO, Rush, Regular) and barcode verification
- ✅ **QC Module**: Quality control verification with dual barcode scanning
- ✅ **Packaging Module**: Shipment packaging and finalization
- ✅ **Warehouse Module**: BRAC structure (Bin, Rack, Area, Column) with heatmap support
- ✅ **Reports Module**: Daily reports for receiving, picking, and shipments
- ✅ **Barcodes Module**: Inventory and picking barcode generation service

#### Frontend
- ✅ **Angular 18 Application**: Modern Angular application with standalone components
- ✅ **PrimeNG 17**: UI component library for professional interfaces
- ✅ **Authentication UI**: Login functionality with route guards
- ✅ **Dashboard**: Overview with inventory summary and recent shipments
- ✅ **13 Complete Components**: All major modules migrated (Login, Dashboard, Navbar, Customers, Shipments, Inventory, Receiving, Picking, QC, Packaging, Warehouse, Reports, Users)
- ✅ **Styling**: TailwindCSS + PrimeNG with touch-optimized responsive design
- ✅ **Services**: AuthService and ApiService with JWT token management
- ✅ **Lazy Loading**: Route-based code splitting for optimal performance

#### Features
- ✅ **Barcode System**: Automatic inventory and picking barcode generation
- ✅ **Order Queuing**: Queue prioritization by FIFO/Rush/Regular and order type (Single/Multiple)
- ✅ **Workflow Management**: End-to-end workflow from receiving to shipping
- ✅ **Role-based Access**: Guards and decorators for role-based route protection
- ✅ **REST API**: Complete RESTful API with validation and error handling

---

## 🔐 Authentication

The system uses JWT-based authentication with 7 roles:

- **Super Admin** - Full system access
- **Inventory Leader** - Oversees receiving & picking
- **Receiving** - Processes inbound shipments
- **Picking** - Retrieves items per order queue
- **Delivery Leader** - Oversees QC & packaging
- **QC** - Validates item correctness
- **Packaging** - Finalizes and ships packages
- **Customer** - Manages SKUs, shipments, and API requests

---

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/profile` - Get current user profile

### Customers
- `GET /api/v1/customers` - List all customers
- `POST /api/v1/customers` - Create customer (with auto-generated API key)
- `GET /api/v1/customers/:id` - Get customer details
- `PATCH /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### Shipments
- `GET /api/v1/shipments` - List all shipments (with optional `customerId` query param)
- `POST /api/v1/shipments` - Create shipment
- `GET /api/v1/shipments/:id` - Get shipment details
- `PATCH /api/v1/shipments/:id` - Update shipment
- `PATCH /api/v1/shipments/:id/status` - Update shipment status
- `DELETE /api/v1/shipments/:id` - Delete shipment

### Inventory
- `GET /api/v1/inventory` - List all inventory items (with optional `customerId` query param)
- `POST /api/v1/inventory` - Create inventory item (auto-generates barcode)
- `GET /api/v1/inventory/:id` - Get inventory item
- `GET /api/v1/inventory/barcode/:barcode` - Get item by barcode
- `PATCH /api/v1/inventory/:id` - Update inventory item
- `PATCH /api/v1/inventory/:id/status` - Update inventory status
- `DELETE /api/v1/inventory/:id` - Delete inventory item

### Receiving
- `GET /api/v1/receiving/purchase-orders` - List all purchase orders
- `POST /api/v1/receiving/purchase-orders` - Create purchase order
- `GET /api/v1/receiving/purchase-orders/:id` - Get purchase order details
- `PATCH /api/v1/receiving/purchase-orders/:id/receive-item` - Receive an item from PO
- `PATCH /api/v1/receiving/purchase-orders/:id/complete` - Complete purchase order

### Picking
- `GET /api/v1/picking/queues` - List all order queues
- `POST /api/v1/picking/queues` - Create order queue from shipment
- `GET /api/v1/picking/queues/:id` - Get order queue details
- `PATCH /api/v1/picking/queues/:id/assign` - Assign queue to picker
- `PATCH /api/v1/picking/queues/:id/complete` - Complete picking
- `PATCH /api/v1/picking/queues/:id/verify` - Verify picked item barcode

### QC (Quality Control)
- `PATCH /api/v1/qc/verify` - Verify item barcodes (inventory + picking)
- `PATCH /api/v1/qc/complete` - Complete QC for order queue (generates shipping labels)

### Packaging
- `GET /api/v1/packaging/ready` - Get shipments ready for packaging
- `PATCH /api/v1/packaging/:id/package` - Package and ship a shipment

### Warehouse
- `GET /api/v1/warehouse/locations` - List all warehouse locations
- `POST /api/v1/warehouse/locations` - Create warehouse location
- `GET /api/v1/warehouse/heatmap` - Get warehouse heatmap data
- `GET /api/v1/warehouse/locations/:id` - Get location details
- `PATCH /api/v1/warehouse/locations/:id` - Update location
- `PATCH /api/v1/warehouse/locations/:id/utilization` - Update utilization count
- `DELETE /api/v1/warehouse/locations/:id` - Delete location

### Reports
- `GET /api/v1/reports/receiving/daily?date=YYYY-MM-DD` - Daily receiving report
- `GET /api/v1/reports/picking/daily?date=YYYY-MM-DD` - Daily picking report
- `GET /api/v1/reports/shipments/daily?date=YYYY-MM-DD` - Daily shipment report

### Users
- `GET /api/v1/users` - List all users (Super Admin only)
- `POST /api/v1/users` - Create user (Super Admin only)
- `GET /api/v1/users/:id` - Get user details
- `PATCH /api/v1/users/:id` - Update user (Super Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Super Admin only)

### Webhooks
- `POST /api/v1/webhooks` - Create webhook subscription
- `GET /api/v1/webhooks` - List all webhooks (with optional `customerId` query param)
- `GET /api/v1/webhooks/:id` - Get webhook details
- `PATCH /api/v1/webhooks/:id` - Update webhook
- `DELETE /api/v1/webhooks/:id` - Delete webhook
- `GET /api/v1/webhooks/:id/logs` - Get webhook logs
- `POST /api/v1/webhooks/:id/logs/:logId/retry` - Retry failed webhook

### File Import/Export
- `POST /api/v1/file-import-export/shipments/import/csv` - Import shipments from CSV
- `POST /api/v1/file-import-export/shipments/import/xlsx` - Import shipments from XLSX
- `GET /api/v1/file-import-export/shipments/export/csv` - Export shipments to CSV
- `GET /api/v1/file-import-export/shipments/export/xlsx` - Export shipments to XLSX
- `GET /api/v1/file-import-export/inventory/export/csv` - Export inventory to CSV
- `GET /api/v1/file-import-export/inventory/export/xlsx` - Export inventory to XLSX

### Billing
- `POST /api/v1/billing/invoices` - Create invoice
- `GET /api/v1/billing/invoices` - List all invoices (with optional `customerId` query param)
- `GET /api/v1/billing/invoices/:id` - Get invoice details
- `PATCH /api/v1/billing/invoices/:id` - Update invoice
- `POST /api/v1/billing/invoices/generate` - Generate invoice for billing period
- `PATCH /api/v1/billing/invoices/:id/paid` - Mark invoice as paid
- `DELETE /api/v1/billing/invoices/:id` - Delete invoice

### Freight Booking
- `POST /api/v1/freight-booking` - Create freight booking
- `GET /api/v1/freight-booking` - List all freight bookings (with optional `shipmentId` query param)
- `GET /api/v1/freight-booking/:id` - Get freight booking details
- `PATCH /api/v1/freight-booking/:id` - Update freight booking
- `PATCH /api/v1/freight-booking/:id/status` - Update freight booking status
- `POST /api/v1/freight-booking/auto-book` - Automatically book freight for shipment
- `DELETE /api/v1/freight-booking/:id` - Delete freight booking

### Tenants
- `POST /api/v1/tenants` - Create tenant (Super Admin only)
- `GET /api/v1/tenants` - List all tenants (Super Admin only)
- `GET /api/v1/tenants/:id` - Get tenant details
- `GET /api/v1/tenants/subdomain/:subdomain` - Get tenant by subdomain
- `PATCH /api/v1/tenants/:id` - Update tenant
- `PATCH /api/v1/tenants/:id/subscription` - Update tenant subscription plan
- `GET /api/v1/tenants/:id/usage` - Get tenant usage statistics
- `DELETE /api/v1/tenants/:id` - Delete tenant

### Subscriptions
- `POST /api/v1/subscriptions` - Create subscription (Super Admin only)
- `GET /api/v1/subscriptions` - List all subscriptions (with optional `tenantId` query param)
- `GET /api/v1/subscriptions/:id` - Get subscription details
- `GET /api/v1/subscriptions/tenant/:tenantId` - Get active subscription for tenant
- `PATCH /api/v1/subscriptions/:id` - Update subscription
- `PATCH /api/v1/subscriptions/:id/activate` - Activate subscription
- `PATCH /api/v1/subscriptions/:id/cancel` - Cancel subscription
- `GET /api/v1/subscriptions/tenant/:tenantId/usage-billing` - Calculate usage-based billing
- `DELETE /api/v1/subscriptions/:id` - Delete subscription

### Metrics
- `GET /api/v1/metrics` - Get Prometheus metrics (endpoint: `/metrics`)

### Dashboard
- `GET /api/v1/dashboard` - Get comprehensive dashboard data
- `GET /api/v1/dashboard/realtime` - Get real-time metrics for WebSocket streaming
- `GET /api/v1/dashboard/realtime-operations` - Get real-time dashboard for daily operations

### Reports
- `GET /api/v1/reports/receiving/daily` - Get daily receiving report
- `GET /api/v1/reports/picking/daily` - Get daily picking report
- `GET /api/v1/reports/shipments/daily` - Get daily shipment report
- `GET /api/v1/reports/insights/executive` - Get executive insight report with KPIs and trends
- `GET /api/v1/reports/insights/financial` - Get financial summary report
- `GET /api/v1/reports/daily-confirmation/:customerId` - Get daily confirmation report for customer
- `GET /api/v1/reports/daily-confirmation` - Get daily confirmation reports for all customers
- `POST /api/v1/reports/daily-confirmation/:customerId/send` - Send daily confirmation report to customer
- `POST /api/v1/reports/daily-confirmation/send-all` - Send daily confirmation reports to all active customers
- `GET /api/v1/reports/performance/departments` - Get performance report for all departments

### Predictive Heatmap & Auto-Placement
- `GET /api/v1/warehouse/predictive-heatmap/:warehouseId` - Get predictive heatmap for warehouse
- `GET /api/v1/warehouse/predictive-heatmap/:warehouseId/recommendations` - Get optimization recommendations
- `GET /api/v1/warehouse/auto-placement/:warehouseId` - Get optimal placement recommendations for SKU
- `POST /api/v1/warehouse/auto-placement/:warehouseId/place` - Automatically place SKU in optimal location

### Anomaly Detection
- `GET /api/v1/inventory/anomalies` - Detect inventory anomalies (with optional `customerId` and `days` query params)
- `GET /api/v1/inventory/anomalies/summary` - Get anomaly detection summary

### Picking Route Optimization
- `GET /api/v1/picking/queues/:id/route` - Get optimized picking route for order queue
- `POST /api/v1/picking/queues/batch-route` - Get optimized route for multiple order queues
- `GET /api/v1/picking/queues/:id/optimize` - Optimize picking route for order queue

### Weekend Freight Scheduling
- `POST /api/v1/freight-booking/weekend/schedule` - Schedule freight for weekend delivery
- `GET /api/v1/freight-booking/weekend/schedules` - Get all weekend scheduled freight
- `PATCH /api/v1/freight-booking/weekend/:id/cancel` - Cancel weekend scheduling

### Enhanced Billing
- `POST /api/v1/billing/enhanced/generate` - Generate enhanced invoice with cubic feet and order count billing
- `GET /api/v1/billing/enhanced/report` - Get detailed billing report with item-level details
- `GET /api/v1/billing/enhanced/storage-cost` - Calculate storage cost per cubic feet
- `GET /api/v1/billing/enhanced/order-cost` - Calculate billing per order count

### 3PL Hub Management
- `POST /api/v1/hubs` - Create a new 3PL hub
- `GET /api/v1/hubs` - Get all 3PL hubs
- `GET /api/v1/hubs/:id` - Get 3PL hub by ID
- `GET /api/v1/hubs/code/:code` - Get 3PL hub by code
- `PATCH /api/v1/hubs/:id` - Update 3PL hub
- `DELETE /api/v1/hubs/:id` - Delete 3PL hub
- `GET /api/v1/hubs/:id/statistics` - Get hub statistics
- `POST /api/v1/hubs/:id/warehouses/:warehouseId` - Assign warehouse to hub
- `POST /api/v1/hubs/:id/customers/:customerId` - Assign customer to hub

### AI Heatmap Updates
- `POST /api/v1/warehouse/heatmap/:warehouseId/ai-update` - Auto-update heatmap using AI predictions
- `GET /api/v1/warehouse/heatmap/:warehouseId/ai-recommendations` - Get AI recommendations for warehouse optimization
- `POST /api/v1/warehouse/heatmap/:warehouseId/schedule-ai-update` - Schedule automatic AI updates

### Freight Management & Configuration
- `GET /api/v1/freight-booking/configs` - Get all freight configurations (optional `active` query param)
- `GET /api/v1/freight-booking/configs/:id` - Get freight configuration by ID
- `GET /api/v1/freight-booking/configs/carrier/:carrierType` - Get configurations by carrier type
- `POST /api/v1/freight-booking/configs` - Create new freight configuration
- `PATCH /api/v1/freight-booking/configs/:id` - Update freight configuration
- `DELETE /api/v1/freight-booking/configs/:id` - Delete freight configuration
- `POST /api/v1/freight-booking/configs/:id/toggle` - Enable/disable freight configuration
- `POST /api/v1/freight-booking/configs/calculate` - Calculate shipping cost
- `POST /api/v1/freight-booking/configs/best-option` - Get best shipping option
- `GET /api/v1/freight-booking/statistics` - Get freight statistics

**Full API documentation available at `/api/docs` when running the backend.**

---

## 🗄️ Database Schema

All entities extend `BaseEntity` with `id`, `createdAt`, `updatedAt`, and `deletedAt` fields:

### Core Entities
- **Users** - System users with roles (email, password, firstName, lastName, role, customerId, isActive)
- **Customers** - Customer accounts (name, contactEmail, apiKey, contactPhone, address, isActive)
- **Shipments** - Outbound shipments (customerId, status, trackingNumber, shippingLabel, packingSlip, items)
- **ShipmentItems** - Items within shipments (shipmentId, sku, size, color, quantity)

### Inventory & Warehouse
- **InventoryItems** - Stock items with barcodes (customerId, sku, size, color, inventoryBarcode, pickingBarcode, status, locationId)
- **WarehouseLocations** - BRAC structure (area, column, rack, bin, locationCode, utilizationCount, maxCapacity, currentCapacity)

### Operations
- **PurchaseOrders** - Inbound receiving (customerId, poNumber, status, receivedBy, receivedAt, items)
- **PurchaseOrderItems** - Items in POs (purchaseOrderId, sku, size, color, expectedQuantity, receivedQuantity, inventoryItemId)
- **OrderQueues** - Picking queues (priority, orderType, status, area, shipmentId, assignedTo, startedAt, completedAt, pickingItems)
- **PickingItems** - Items being picked (orderQueueId, inventoryItemId, pickedAt, pickedBy, verified)

**Note**: All entities support soft deletes (`deletedAt` field) except junction tables.

---

## 🔄 Workflow

1. **Receiving**: Create PO → Generate barcodes → Receive items → Store in warehouse
2. **Picking**: Create order queue → Generate picking barcodes → Pick items → Verify
3. **QC**: Verify barcodes match → Generate shipping labels → Approve
4. **Packaging**: Package items → Attach labels → Mark as shipped

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 📝 Environment Variables

See `.env.example` in each module for required environment variables.

---

## 📖 Documentation

- [Product Requirements Document](./PRD.md)
- [Development Roadmap](./ROADMAP.md)

---

## ✅ Phase 2 Features (3PL Ready) - COMPLETED

The following Phase 2 features have been fully implemented:

#### Multi-Warehouse Support
- ✅ **Warehouse Entity**: Complete warehouse CRUD operations
- ✅ **Multi-Warehouse Locations**: Locations linked to specific warehouses
- ✅ **Auto-Generated Location Codes**: Format: `WAREHOUSE-AREA-COLUMN-RACK-BIN`
- ✅ **Warehouse Filtering**: Filter shipments, inventory, and locations by warehouse

#### Warehouse Heatmap Auto-Update
- ✅ **Automatic Updates**: Heatmap updates automatically on pick/place operations
- ✅ **Pick/Place Tracking**: Tracks last picked/placed times
- ✅ **Utilization Metrics**: Real-time utilization percentage calculation
- ✅ **Manual Refresh**: API endpoint to manually refresh warehouse heatmap

#### Rack Layout Optimization
- ✅ **Optimal Placement Finder**: Suggests best rack location for SKU based on movement frequency
- ✅ **SKU Movement Analysis**: Calculates movement frequency per SKU
- ✅ **Optimization Recommendations**: Provides consolidation and redistribution suggestions
- ✅ **Score-Based Placement**: Multi-factor scoring system for location selection

#### Bin Utilization Analytics
- ✅ **Warehouse Metrics**: Comprehensive utilization metrics per warehouse
- ✅ **Area-Level Analytics**: Utilization breakdown by area
- ✅ **Over/Under Utilization Reports**: Identifies overutilized (>90%) and underutilized (<20%) locations
- ✅ **Trends Analysis**: Utilization trends over time

#### Partial Shipment Support
- ✅ **Fulfillment Tracking**: Track fulfilled quantity vs total quantity
- ✅ **Fulfillment Percentage**: Automatic calculation of fulfillment percentage
- ✅ **Status Management**: Automatic status update (Partially Shipped when >0% fulfilled)
- ✅ **Incremental Fulfillment**: Add fulfilled quantity incrementally

---

## ✅ Phase 3 Features (Integrations & Automation) - COMPLETED

The following Phase 3 features have been fully implemented:

#### Webhook System
- ✅ **Event Subscriptions**: Customers can subscribe to multiple webhook events
- ✅ **Automatic Notifications**: Webhooks automatically triggered on shipment status changes
- ✅ **Event Types**: Shipment created, updated, shipped, partially shipped, ready
- ✅ **Webhook Logging**: Complete logging system with success/failure tracking
- ✅ **Retry Mechanism**: Automatic retry for failed webhooks
- ✅ **Signature Verification**: HMAC-SHA256 signature for webhook security
- ✅ **Status Management**: Automatic deactivation after multiple failures

#### File Import/Export
- ✅ **CSV Import**: Import shipments from CSV files
- ✅ **XLSX Import**: Import shipments from Excel files
- ✅ **CSV Export**: Export shipments and inventory to CSV
- ✅ **XLSX Export**: Export shipments and inventory to Excel with formatting
- ✅ **Bulk Operations**: Support for bulk data import/export
- ✅ **Error Handling**: Comprehensive error reporting for import failures

#### Customer Billing Module
- ✅ **Invoice Management**: Complete invoice CRUD operations
- ✅ **Usage-Based Billing**: Automatic billing based on storage, shipments, fulfillment
- ✅ **Billing Types**: Storage (cubic feet), Shipments (order count), Fulfillment (per item)
- ✅ **Period-Based Billing**: Generate invoices for specific billing periods
- ✅ **Invoice Status**: Draft, Pending, Paid, Overdue, Cancelled
- ✅ **Automatic Calculation**: Automatic calculation of subtotal, tax, and total

#### Automated Freight Booking
- ✅ **Carrier Support**: Support for UPS, FedEx, USPS, DHL, and Custom carriers
- ✅ **Automatic Booking**: Auto-book freight when shipment is ready
- ✅ **Cost Estimation**: Automatic cost calculation based on shipment details
- ✅ **Tracking Integration**: Automatic tracking number generation
- ✅ **Delivery Estimation**: Estimated delivery date calculation
- ✅ **Status Tracking**: Track booking status (Pending, Booked, In Transit, Delivered)

---

## ✅ Phase 4 Features (SaaS Scaling) - COMPLETED

The following Phase 4 features have been fully implemented:

#### Tenant Isolation
- ✅ **Multi-Tenant Model**: Complete tenant entity with subdomain support
- ✅ **Database Isolation**: Tenant ID added to entities for data segregation
- ✅ **Tenant Middleware**: Automatic tenant context extraction from headers/subdomain
- ✅ **Tenant Interceptors**: Automatic tenant ID injection in responses
- ✅ **Tenant Guards**: Role-based access with tenant context

#### Subscription Management
- ✅ **Subscription Plans**: Free, Starter, Professional, Enterprise tiers
- ✅ **Plan Limits**: Configurable limits for users, warehouses, storage, shipments
- ✅ **Usage Tracking**: Real-time usage statistics per tenant
- ✅ **Usage-Based Billing**: Overage charges calculation for exceeded limits
- ✅ **Subscription Lifecycle**: Trial, Active, Suspended, Cancelled, Expired statuses
- ✅ **External Integration**: Support for Stripe subscription IDs

#### Monitoring
- ✅ **Prometheus Integration**: Metrics collection for HTTP requests, business metrics, system metrics
- ✅ **Grafana Dashboards**: Pre-configured dashboards for visualization
- ✅ **Node Exporter**: System-level metrics collection
- ✅ **Custom Metrics**: Shipment tracking, inventory counts, active users
- ✅ **HTTP Metrics**: Request duration, status codes, error rates

#### CI/CD Pipeline
- ✅ **GitHub Actions**: Automated workflow for testing and deployment
- ✅ **Automated Testing**: Lint and test execution on push/PR
- ✅ **Docker Builds**: Automated Docker image building with caching
- ✅ **Multi-Stage Deployment**: Separate staging and production environments
- ✅ **Build Caching**: Optimized Docker layer caching for faster builds

---

## ✅ Phase 5 Features (Advanced Intelligence) - COMPLETED

The following Phase 5 features have been fully implemented:

#### Predictive Heatmaps
- ✅ **AI-Based Forecasting**: Uses historical data and movement patterns to predict future utilization
- ✅ **Confidence Scoring**: Calculates prediction confidence based on data quality and movement frequency
- ✅ **Trend Analysis**: Identifies increasing, decreasing, or stable utilization trends
- ✅ **Optimization Recommendations**: Provides actionable recommendations for over/under-utilized locations
- ✅ **Configurable Prediction Period**: Support for 7, 14, 30-day forecasting windows

#### Auto-Rack Placement
- ✅ **Movement Frequency Analysis**: Calculates SKU movement frequency from historical picking data
- ✅ **Multi-Factor Scoring**: Scores locations based on distance, utilization, movement alignment, and accessibility
- ✅ **Optimal Recommendations**: Returns top 5 location recommendations with detailed reasoning
- ✅ **Automatic Placement**: Auto-place SKU in optimal location with single API call
- ✅ **Frequency-Based Placement**: High-frequency SKUs placed in easily accessible areas

#### Inventory Anomaly Detection
- ✅ **Stock Level Anomalies**: Detects excessive stock and low stock situations
- ✅ **Movement Pattern Anomalies**: Identifies unusual high movement and stale inventory
- ✅ **Location Anomalies**: Finds missing locations and location overcrowding
- ✅ **Data Quality Anomalies**: Detects incomplete item data (missing size/color)
- ✅ **Severity Classification**: Critical, High, Medium, Low severity levels
- ✅ **Actionable Recommendations**: Provides specific recommendations for each anomaly
- ✅ **Summary Dashboard**: Anomaly trends and top anomalies for quick review

#### Real-Time Performance Dashboards
- ✅ **Comprehensive Metrics**: Aggregates data from shipments, inventory, picking, receiving, warehouse
- ✅ **Performance Trends**: 7-day trend analysis with directional indicators
- ✅ **Today's Reports**: Real-time daily reports for receiving, picking, shipments
- ✅ **Critical Alerts**: Automatic detection of unlocated inventory and old pending shipments
- ✅ **Real-Time Metrics**: Endpoint for WebSocket streaming of live metrics
- ✅ **Fulfillment Tracking**: Real-time fulfillment rates and completion times

---

## ✅ Phase 6 Features (Future Expansion) - COMPLETED

The following Phase 6 features have been fully implemented:

#### Picking Route Optimization
- ✅ **Shortest Path Algorithm**: Nearest neighbor algorithm for optimal route calculation
- ✅ **Route Visualization**: Waypoints, sequence, and coordinate mapping
- ✅ **Distance Calculation**: BRAC-based distance calculation with Euclidean fallback
- ✅ **Time Estimation**: Estimated picking time based on locations and distance
- ✅ **Batch Picking**: Optimized routes for multiple order queues
- ✅ **Sequence Mapping**: Automatic mapping of picking items to route sequence

#### 3PL Hub Management
- ✅ **Hub Entity**: Complete hub management with multi-warehouse and multi-customer support
- ✅ **Hub Statistics**: Comprehensive statistics for warehouses and customers per hub
- ✅ **Hub Assignment**: Assign warehouses and customers to hubs
- ✅ **Multi-Entity Coordination**: Coordinate operations across multiple warehouses and customers

#### Weekend Freight Scheduling
- ✅ **Weekend Delivery**: Schedule freight for weekend delivery
- ✅ **Cutoff Date Validation**: Automatic validation of cutoff dates (typically Thursday 5 PM)
- ✅ **Next Weekend Calculation**: Automatic calculation of next weekend date
- ✅ **Weekend Schedules**: View and manage all weekend scheduled freight
- ✅ **Schedule Cancellation**: Cancel weekend schedules when needed

#### Enhanced Billing
- ✅ **Cubic Feet Billing**: Calculate storage cost per cubic feet with item-level volume estimation
- ✅ **Order Count Billing**: Calculate billing per order count
- ✅ **Detailed Reports**: Item-level billing reports with cubic feet-days calculation
- ✅ **Enhanced Invoices**: Generate invoices with both storage and order-based billing
- ✅ **Billing Breakdown**: Detailed breakdown of storage and order costs

#### AI Heatmap Auto-Update
- ✅ **AI-Powered Updates**: Automatic heatmap updates using ML predictions
- ✅ **Proactive Adjustments**: Capacity adjustments based on AI predictions
- ✅ **AI Recommendations**: Actionable recommendations for warehouse optimization
- ✅ **Auto-Scheduling**: Schedule automatic AI updates (24-hour intervals)
- ✅ **High-Priority Actions**: Prioritized action items based on AI confidence scores

---

## ✅ Phase 7 Features (Improvements) - COMPLETED

The following Phase 7 features have been fully implemented:

#### Automated Testing
- ✅ **Backend Unit Tests**: Test suites for CustomersService, ShipmentsService with Jest
- ✅ **Frontend Unit Tests**: Test suites for ApiService and controllers with Karma/Jasmine
- ✅ **Test Coverage**: Comprehensive test coverage for core services
- ✅ **CI/CD Integration**: Tests integrated into GitHub Actions workflow

#### Freight Management & Configuration
- ✅ **Freight Configuration Service**: Complete carrier configuration management
- ✅ **Default Configurations**: Pre-configured UPS, FedEx, and USPS services
- ✅ **Rate Calculation**: Automatic shipping cost calculation based on weight, volume, and service
- ✅ **Best Option Selection**: AI-powered selection of optimal shipping service
- ✅ **Weekend Delivery Support**: Configuration for weekend delivery options
- ✅ **Carrier Management**: Enable/disable carriers, update rates, manage services
- ✅ **Freight Statistics**: Comprehensive statistics on bookings and carriers

#### User Guidelines
- ✅ **Complete User Guide**: Comprehensive documentation covering all workflows
- ✅ **Role-Based Instructions**: Detailed guides for each user role
- ✅ **API Integration Guide**: Examples and documentation for API usage
- ✅ **Troubleshooting Section**: Common issues and solutions
- ✅ **Best Practices**: Guidelines for optimal warehouse operations

---

## 🎯 Project Status

All planned phases (1-7) have been completed! The FulfillFlow WMS SaaS is now a comprehensive warehouse management system with:

✅ Complete WMS functionality (receiving, picking, QC, packaging)
✅ Multi-tenant SaaS architecture
✅ AI-powered predictive analytics
✅ Automated route optimization
✅ 3PL hub management
✅ Comprehensive billing system
✅ Automated testing suite
✅ Freight management & configuration
✅ Complete user documentation

---

## ✅ Phase 8 Features (Reports) - COMPLETED

The following Phase 8 features have been fully implemented:

#### Insight Reports for High-Level Management
- ✅ **Executive Insight Reports**: Comprehensive KPIs including shipment metrics, inventory metrics, financial metrics, and operational metrics
- ✅ **Financial Summary Reports**: Revenue tracking, payment rates, revenue by month, top customers analysis
- ✅ **Trend Analysis**: Daily shipment trends with trend direction calculation (increasing, decreasing, stable)
- ✅ **Automated Insights**: AI-powered insights and recommendations based on KPIs
- ✅ **Customizable Periods**: Reports for any date range with customer/warehouse filtering

#### Real-Time Dashboard for Daily Operations
- ✅ **Real-Time Operations Dashboard**: Live updates on today's receiving, picking, and shipping operations
- ✅ **Today's Metrics**: Real-time counts and completion rates for all operations
- ✅ **Active Operations Tracking**: Monitor active POs and picking queues
- ✅ **Warehouse Status**: Real-time warehouse utilization and location status
- ✅ **Inventory Status**: Current inventory levels and readiness
- ✅ **Alerts System**: Automatic alerts for old pending shipments, low inventory, and other issues
- ✅ **Summary Calculations**: Overall completion rates and operational summary

#### Daily Confirmation Reports for Customers
- ✅ **Automated Daily Reports**: Generate daily confirmation reports for individual customers or all customers
- ✅ **Comprehensive Summaries**: Total items received, shipped, shipments, POs, and picking queues
- ✅ **Detailed Shipment Information**: Shipment status, quantities, fulfillment percentages
- ✅ **Purchase Order Details**: PO status, items received, receipt dates
- ✅ **Automated Distribution**: Send reports via webhooks to customer endpoints
- ✅ **Report Templates**: Formatted report templates for email/PDF generation
- ✅ **Batch Processing**: Generate and send reports for all active customers

#### Department Performance Reports
- ✅ **Receiving Performance**: Completion rates, processing times, throughput, accuracy rates
- ✅ **Picking Performance**: Queue completion, processing times, throughput, verification accuracy
- ✅ **QC Performance**: Processing rates, average QC time, shipment accuracy
- ✅ **Packaging Performance**: Packaging rates, processing times, throughput
- ✅ **Performance Ratings**: Overall rating system (Excellent, Good, Fair, Poor) based on multiple metrics
- ✅ **Comparative Analysis**: Compare performance across departments
- ✅ **Historical Tracking**: Performance tracking over time periods

---

## 🎯 Project Status

All planned phases (1-8) have been completed! The FulfillFlow WMS SaaS is now a comprehensive warehouse management system with:

✅ Complete WMS functionality (receiving, picking, QC, packaging)
✅ Multi-tenant SaaS architecture
✅ AI-powered predictive analytics
✅ Automated route optimization
✅ 3PL hub management
✅ Comprehensive billing system
✅ Automated testing suite
✅ Freight management & configuration
✅ Complete user documentation
✅ Advanced reporting and analytics

See [ROADMAP.md](./ROADMAP.md) for complete development history.
See [USER_GUIDE.md](./USER_GUIDE.md) for user documentation.

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

---

## 📄 License

Copyright © 2025 FulfillFlow. All rights reserved.