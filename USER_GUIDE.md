# FulfillFlow WMS User Guide

**Version:** 1.0  
**Last Updated:** 2025

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Workflows](#core-workflows)
4. [Warehouse Management](#warehouse-management)
5. [Advanced Features](#advanced-features)
6. [API Integration](#api-integration)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Initial Setup

1. **Access the System**
   - Navigate to `http://localhost:4200` (development)
   - Or your production URL
   - Login with your credentials

2. **First-Time Login**
   - Contact your administrator for initial login credentials
   - Change your password on first login
   - Complete your profile information

3. **Dashboard Overview**
   - View key metrics: shipments, inventory, picking queues
   - Monitor real-time performance indicators
   - Access quick actions for common tasks

---

## User Roles & Permissions

### Super Admin
- Full system access
- User management
- System configuration
- Tenant management
- Billing management

### Inventory Leader
- Manage receiving and picking operations
- Warehouse configuration
- Inventory management
- Reporting and analytics

### Receiving
- Process inbound shipments
- Create purchase orders
- Generate barcodes
- Receive items into warehouse

### Picking
- View order queues
- Pick items from warehouse
- Verify barcodes
- Complete picking tasks

### Delivery Leader
- Oversee QC and packaging
- Manage shipment status
- Monitor fulfillment rates
- Review reports

### QC (Quality Control)
- Verify picked items
- Validate barcodes
- Approve shipments for packaging
- Flag discrepancies

### Packaging
- Package approved shipments
- Generate shipping labels
- Book freight
- Mark shipments as shipped

### Customer
- Create shipments via API or dashboard
- View inventory and shipment status
- Access reports
- Manage webhooks

---

## Core Workflows

### 1. Receiving Process

**Step 1: Create Purchase Order**
- Navigate to **Receiving** → **Create PO**
- Enter customer information
- Add items (SKU, size, color, quantity)
- Save PO

**Step 2: Generate Barcodes**
- System automatically generates inventory barcodes for each item
- Print barcodes for physical labeling

**Step 3: Receive Items**
- Scan or enter inventory barcodes
- Select warehouse location (or use auto-placement)
- Update item status to "Ready"
- Items are now available for picking

**Best Practices:**
- Verify quantities before receiving
- Use recommended locations for optimal warehouse efficiency
- Label items immediately after receiving

---

### 2. Picking Process

**Step 1: Order Queue Creation**
- Orders are automatically queued when shipments are created
- Queue prioritization: FIFO, Rush, Regular

**Step 2: View Picking Route**
- Navigate to **Picking** → **Order Queues**
- Select a queue to view optimized picking route
- Route shows sequence of locations to visit

**Step 3: Pick Items**
- Follow optimized route
- Scan location barcode
- Scan item barcode to verify
- Place item in picking bin

**Step 4: Complete Picking**
- Verify all items are picked
- Mark queue as complete
- Items move to QC stage

**Tips:**
- Use the route optimization feature to minimize walking distance
- Verify barcodes match before picking
- Report any discrepancies immediately

---

### 3. QC Process

**Step 1: Receive Items from Picking**
- Items arrive in QC with picking barcodes attached
- Review order requirements

**Step 2: Verify Items**
- Scan both inventory and picking barcodes
- Verify SKU, size, color match order
- Check item condition

**Step 3: Generate Labels**
- Once all items verified, generate:
  - Shipping label
  - Packing slip

**Step 4: Approve for Packaging**
- Mark shipment as "Ready"
- Move bin to packaging area

---

### 4. Packaging Process

**Step 1: Receive from QC**
- Items arrive with shipping labels and packing slips

**Step 2: Package Items**
- Verify item count matches packing slip
- Package items securely
- Attach shipping label
- Attach packing slip

**Step 3: Book Freight (Optional)**
- Select carrier
- Choose shipping service
- System calculates cost
- Book freight automatically or manually

**Step 4: Mark as Shipped**
- Update shipment status to "Shipped"
- Record tracking number
- System updates inventory status

---

## Warehouse Management

### Location System (BRAC)

The warehouse uses a **BRAC** (Bin, Rack, Area, Column) structure:

- **Area**: Warehouse section (A, B, C, etc.)
- **Column**: Column within area
- **Rack**: Rack within column
- **Bin**: Specific bin location

**Location Code Format:** `WAREHOUSE-AREA-COLUMN-RACK-BIN`

Example: `WH-001-A-1-2-3` = Warehouse 001, Area A, Column 1, Rack 2, Bin 3

### Heatmap

**Viewing Heatmap:**
- Navigate to **Warehouse** → **Heatmap**
- Select warehouse
- View color-coded utilization:
  - Green: Low utilization (<20%)
  - Yellow: Medium utilization (20-80%)
  - Red: High utilization (>80%)

**Predictive Heatmap:**
- Access AI-powered predictive heatmap
- View 7, 14, or 30-day forecasts
- Get optimization recommendations

**Auto-Updates:**
- Heatmap updates automatically on pick/place operations
- AI updates can be scheduled for automatic optimization

### Auto-Rack Placement

**Using Auto-Placement:**
1. When receiving items, system suggests optimal location
2. Suggestions based on:
   - SKU movement frequency
   - Location utilization
   - Distance from picking areas
   - Accessibility

**Manual Override:**
- You can manually select location if needed
- System tracks placement efficiency

---

## Advanced Features

### Route Optimization

**Single Order Route:**
- View optimized route for one order queue
- Shows sequence, distance, estimated time

**Batch Picking Route:**
- Optimize route for multiple orders
- Maximize efficiency by combining picks
- Reduce walking distance

**Accessing Routes:**
- Navigate to **Picking** → **Order Queues**
- Click "View Route" on any queue
- Route visualization shows waypoints

### Anomaly Detection

**Accessing Anomalies:**
- Navigate to **Inventory** → **Anomalies**
- View detected issues:
  - Excessive stock
  - Low stock
  - Missing locations
  - Stale inventory
  - Data quality issues

**Severity Levels:**
- Critical: Immediate action required
- High: Action needed soon
- Medium: Monitor closely
- Low: Informational

**Taking Action:**
- Review recommendations
- Address critical issues first
- Update inventory as needed

### Predictive Analytics

**Predictive Heatmaps:**
- Forecast future utilization
- Confidence scores indicate prediction reliability
- Trend analysis (increasing, decreasing, stable)

**AI Recommendations:**
- Get actionable optimization suggestions
- Prioritized by impact and confidence
- Automatically generated recommendations

### Billing & Invoicing

**Viewing Invoices:**
- Navigate to **Billing** → **Invoices**
- Filter by customer or date range
- View detailed breakdown

**Billing Methods:**
- Storage cost (per cubic feet)
- Order count billing
- Fulfillment charges
- Combined billing

**Generating Invoices:**
- Automatic generation at end of billing period
- Manual generation available
- Export to CSV/XLSX

---

## API Integration

### Authentication

**Getting API Key:**
1. Navigate to **Customers** → **Your Profile**
2. View or generate API key
3. Keep API key secure

**Using API Key:**
```bash
curl -H "X-API-Key: your-api-key" \
     https://api.fulfillflow.com/api/v1/shipments
```

### Creating Shipments

**Example Request:**
```json
POST /api/v1/shipments
{
  "customerId": "customer-id",
  "warehouseId": "warehouse-id",
  "items": [
    {
      "sku": "SKU001",
      "size": "M",
      "color": "Blue",
      "quantity": 5
    }
  ]
}
```

**Response:**
```json
{
  "id": "shipment-id",
  "status": "Pending",
  "totalQuantity": 5,
  "fulfilledQuantity": 0,
  "fulfillmentPercentage": 0
}
```

### Webhooks

**Setting Up Webhooks:**
1. Navigate to **Webhooks** → **Create Webhook**
2. Enter webhook URL
3. Select events to subscribe:
   - `shipment.created`
   - `shipment.updated`
   - `shipment.shipped`
   - `shipment.partially_shipped`
   - `shipment.ready`

**Webhook Payload:**
```json
{
  "event": "shipment.shipped",
  "timestamp": "2025-01-01T12:00:00Z",
  "data": {
    "id": "shipment-id",
    "status": "Shipped",
    "trackingNumber": "TRACK123"
  },
  "signature": "hmac-signature"
}
```

**Verifying Webhooks:**
- Validate `X-Webhook-Signature` header
- Verify timestamp is recent
- Process events idempotently

---

## Troubleshooting

### Common Issues

**1. Cannot Login**
- Verify credentials are correct
- Check account is active
- Contact administrator if locked out

**2. Barcode Not Scanning**
- Check barcode is properly printed
- Verify scanner settings
- Manually enter barcode if needed

**3. Location Not Found**
- Verify location code format
- Check location exists in system
- Verify warehouse assignment

**4. Route Not Generating**
- Ensure items have assigned locations
- Verify order queue has items
- Check for unpicked items

**5. Webhook Not Receiving Events**
- Verify webhook URL is accessible
- Check webhook is active
- Review webhook logs for errors

### Getting Help

**Support Channels:**
- Email: support@fulfillflow.com
- Documentation: https://docs.fulfillflow.com
- API Docs: https://api.fulfillflow.com/api/docs

**Reporting Issues:**
- Include error messages
- Describe steps to reproduce
- Provide screenshots if applicable
- Include relevant logs

---

## Best Practices

### Receiving
- Verify quantities match PO before receiving
- Use recommended locations for new items
- Label items immediately after receiving
- Update PO status promptly

### Picking
- Follow optimized routes when available
- Verify barcodes before picking
- Report discrepancies immediately
- Keep picking bins organized

### QC
- Verify all items match order requirements
- Check item condition
- Flag any quality issues
- Complete verification before packaging

### Packaging
- Verify item count matches packing slip
- Package items securely
- Attach all labels correctly
- Update shipment status after packaging

### Warehouse Management
- Regular review of heatmaps
- Act on anomaly detection alerts
- Use predictive analytics for planning
- Maintain accurate location data

---

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + /`: Show shortcuts
- `Esc`: Close modal/dialog
- `Tab`: Navigate between fields
- `Enter`: Submit form

---

## Additional Resources

- [API Documentation](./API.md)
- [Admin Guide](./ADMIN_GUIDE.md)
- [Integration Examples](./INTEGRATIONS.md)
- [Release Notes](./CHANGELOG.md)

---

**Need Help?** Contact support@fulfillflow.com or visit our documentation portal.
