# API Endpoints Verification

This document lists all API endpoints used in the Angular frontend components.

## Authentication
- ✅ `POST /api/v1/auth/login` - LoginComponent

## Dashboard
- ✅ `GET /api/v1/dashboard` - DashboardComponent
- ✅ `GET /api/v1/shipments` - DashboardComponent (fallback)
- ✅ `GET /api/v1/inventory` - DashboardComponent (fallback)

## Customers
- ✅ `GET /api/v1/customers` - CustomersComponent
- ✅ `POST /api/v1/customers` - CustomersComponent (create)
- ✅ `PATCH /api/v1/customers/:id` - CustomersComponent (update, toggle active)
- ✅ `DELETE /api/v1/customers/:id` - CustomersComponent

## Inventory
- ✅ `GET /api/v1/customers` - InventoryComponent
- ✅ `GET /api/v1/inventory` - InventoryComponent
- ✅ `GET /api/v1/inventory?customerId=:id` - InventoryComponent (filter)
- ✅ `POST /api/v1/inventory` - InventoryComponent (single)
- ✅ `POST /api/v1/inventory/bulk` - InventoryComponent (bulk)
- ✅ `PATCH /api/v1/inventory/:id` - InventoryComponent
- ✅ `DELETE /api/v1/inventory/:id` - InventoryComponent
- ✅ `GET /api/v1/inventory/summary/by-sku` - InventoryComponent (summary)

## Users
- ✅ `GET /api/v1/users` - UsersComponent
- ✅ `GET /api/v1/customers` - UsersComponent
- ✅ `POST /api/v1/users` - UsersComponent
- ✅ `PATCH /api/v1/users/:id` - UsersComponent
- ✅ `DELETE /api/v1/users/:id` - UsersComponent

## Shipments
- ✅ `GET /api/v1/customers` - ShipmentsComponent
- ✅ `GET /api/v1/warehouse` - ShipmentsComponent
- ✅ `GET /api/v1/shipments` - ShipmentsComponent
- ✅ `POST /api/v1/shipments` - ShipmentsComponent
- ✅ `PATCH /api/v1/shipments/:id` - ShipmentsComponent
- ✅ `PATCH /api/v1/shipments/:id/status` - ShipmentsComponent
- ✅ `DELETE /api/v1/shipments/:id` - ShipmentsComponent

## Receiving
- ✅ `GET /api/v1/customers` - ReceivingComponent
- ✅ `GET /api/v1/receiving/purchase-orders` - ReceivingComponent
- ✅ `POST /api/v1/receiving/purchase-orders` - ReceivingComponent
- ✅ `PATCH /api/v1/receiving/purchase-orders/:id/complete` - ReceivingComponent

## Picking
- ✅ `GET /api/v1/shipments?status=Ready` - PickingComponent
- ✅ `GET /api/v1/picking/queues` - PickingComponent
- ✅ `POST /api/v1/picking/queues` - PickingComponent
- ✅ `GET /api/v1/picking/queues/:id/route` - PickingComponent
- ✅ `PATCH /api/v1/picking/queues/:id/assign` - PickingComponent
- ✅ `PATCH /api/v1/picking/queues/:id/complete` - PickingComponent

## QC
- ✅ `GET /api/v1/picking/queues` - QcComponent
- ✅ `PATCH /api/v1/qc/verify` - QcComponent
- ✅ `PATCH /api/v1/qc/complete` - QcComponent

## Packaging
- ✅ `GET /api/v1/packaging/ready` - PackagingComponent
- ✅ `PATCH /api/v1/packaging/:id/package` - PackagingComponent

## Warehouse
- ✅ `GET /api/v1/warehouse` - WarehouseComponent
- ✅ `GET /api/v1/warehouse/locations` - WarehouseComponent
- ✅ `GET /api/v1/warehouse/heatmap` - WarehouseComponent
- ✅ `POST /api/v1/warehouse` - WarehouseComponent
- ✅ `POST /api/v1/warehouse/locations` - WarehouseComponent
- ✅ `PATCH /api/v1/warehouse/heatmap/:id/refresh` - WarehouseComponent
- ✅ `DELETE /api/v1/warehouse/locations/:id` - WarehouseComponent

## Reports
- ✅ `GET /api/v1/customers` - ReportsComponent
- ✅ `GET /api/v1/reports/receiving/daily?date=:date` - ReportsComponent
- ✅ `GET /api/v1/reports/picking/daily?date=:date` - ReportsComponent
- ✅ `GET /api/v1/reports/shipments/daily?date=:date` - ReportsComponent
- ✅ `GET /api/v1/reports/insights/executive` - ReportsComponent
- ✅ `GET /api/v1/reports/insights/financial` - ReportsComponent
- ✅ `GET /api/v1/reports/performance/departments` - ReportsComponent
- ✅ `GET /api/v1/dashboard/realtime-operations` - ReportsComponent

All endpoints match the backend API structure documented in README.md ✅
