# Product Requirements Document
**Product:** FulfillFlow — Apparel Fulfillment WMS SaaS  
**Version:** 1.0  
**Owner:** Bao Dang  
**Date:** October 31, 2025

---

## 1. Purpose

To build a **centralized WMS SaaS** designed for apparel fulfillment — enabling brands to store, track, and fulfill their inventory efficiently across multiple customers and warehouses.

---

## 2. Target Users
| Role | Description |
|------|--------------|
| Super Admin | Manages global settings, users, roles |
| Inventory Leader | Oversees receiving & picking |
| Receiving | Processes inbound shipments |
| Picking | Retrieves items per order queue |
| Delivery Leader | Oversees QC & packaging |
| QC | Validates item correctness |
| Packaging | Finalizes and ships packages |
| Customer | Manages SKUs, shipments, and API requests |

---

## 3. Functional Requirements

### 3.1 Customer Management
- Create and manage customer profiles.
- Assign API keys and roles.
- Customer dashboard showing SKUs, stock, and shipment status.

### 3.2 Warehouse / Rack Layout
- BRAC structure: Bin, Rack, Area, Column.
- Generate layouts dynamically.
- Display heatmap of frequently picked SKUs.

### 3.3 Receiving Process
**Flow:**
1. Create PO entry → Input into system.
2. System generates **Inventory Barcode** per SKU.
3. Receiving team labels and loads items to racks.
4. Status: “Ready”.

### 3.4 Picking Process
**Flow:**
1. Orders queued by:
   - FIFO
   - Rush / Fast / Regular
   - Single or Multi-item lines
2. System generates **Picking Barcodes**.
3. Staff scans rack, confirms match, attaches barcode to item.
4. Items placed in bin by Order # and sent to QC.

### 3.5 QC Process
**Flow:**
1. QC scans both barcodes to validate match.
2. If all items verified → print shipping label + packing slip.
3. Send bin to Packaging.

### 3.6 Packaging Process
**Flow:**
1. Packaging scans items to confirm count.
2. Stick shipping label and packing slip.
3. Move to “Ready for Truck” status.

---

## 4. Non-Functional Requirements
- SaaS multi-tenant support
- Dockerized microservices
- API-first architecture
- Secure JWT authentication
- 99.9% uptime SLA (production)
- PostgreSQL replication for data reliability

---

## 5. API Design (Sample)
### POST `/api/v1/customers`
Create a customer account.

### POST `/api/v1/shipments`
Create a shipment request.

### POST `/api/v1/orders/fulfill`
Submit fulfillment request.

### GET `/api/v1/inventory/:customer_id`
Retrieve inventory by customer.

---

## 6. Data Models (Simplified)
```ts
Customer {
  id: string;
  name: string;
  apiKey: string;
  contactEmail: string;
}

Shipment {
  id: string;
  customerId: string;
  items: ShipmentItem[];
  status: 'Pending' | 'Receiving' | 'Ready' | 'Shipped';
}

Item {
  sku: string;
  size: string;
  color: string;
  location: string;
  status: string;
}

OrderQueue {
  id: string;
  priority: 'FIFO' | 'Rush' | 'Regular';
  orderType: 'Single' | 'Multiple';
  area: string;
}
