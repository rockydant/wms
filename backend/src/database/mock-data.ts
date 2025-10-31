import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from '../customers/entities/customer.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { ShipmentItem } from '../shipments/entities/shipment-item.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { PurchaseOrder } from '../receiving/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../receiving/entities/purchase-order-item.entity';
import { OrderQueue } from '../picking/entities/order-queue.entity';
import { WarehouseLocation } from '../warehouse/entities/warehouse-location.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';

/**
 * Mock Data Generator Script
 * Creates a fake company/customer with sample data for testing
 * 
 * Usage:
 *   npm run mock-data                    # Creates "Fashion Trends Inc." (default)
 *   npm run mock-data -- ethika          # Creates "Ethika" company
 *   npm run mock-data -- "Company Name"  # Creates custom company
 * 
 * Or call the function directly:
 *   generateMockDataForCompany("Ethika")
 */
async function generateMockDataForCompany(companyName: string = 'Fashion Trends Inc.') {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'fulfillflow',
    password: process.env.DB_PASSWORD || 'fulfillflow',
    database: process.env.DB_DATABASE || 'fulfillflow',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const customerRepository = dataSource.getRepository(Customer);
    const shipmentRepository = dataSource.getRepository(Shipment);
    const shipmentItemRepository = dataSource.getRepository(ShipmentItem);
    const inventoryRepository = dataSource.getRepository(InventoryItem);
    const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);
    const purchaseOrderItemRepository = dataSource.getRepository(PurchaseOrderItem);
    const orderQueueRepository = dataSource.getRepository(OrderQueue);
    const warehouseRepository = dataSource.getRepository(Warehouse);
    const locationRepository = dataSource.getRepository(WarehouseLocation);

    // Check if mock customer already exists
    let mockCustomer = await customerRepository.findOne({
      where: { name: companyName },
    });

    if (mockCustomer) {
      console.log(`ℹ️  Customer "${companyName}" already exists, using existing customer`);
      console.log('📋 Customer ID:', mockCustomer.id);
      console.log('💡 To regenerate data, delete the customer first');
    }

    // Generate company-specific details
    const companySlug = companyName.toLowerCase().replace(/\s+/g, '');
    const emailDomain = companySlug.includes('ethika') ? 'ethika.com' : 
                       companySlug.includes('fashion') ? 'fashiontrends.com' :
                       `${companySlug}.com`;
    const contactEmail = `orders@${emailDomain}`;
    const phoneNumber = `+1-555-${Math.floor(Math.random() * 9000) + 1000}`;
    const streetNumber = Math.floor(Math.random() * 900) + 100;
    const address = `${streetNumber} ${companyName.split(' ')[0]} Street, New York, NY ${Math.floor(Math.random() * 90000) + 10000}`;

    // Create Mock Customer if it doesn't exist
    if (!mockCustomer) {
      console.log(`📦 Creating mock customer: ${companyName}...`);
      const apiKey = `mock_${companySlug}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      mockCustomer = customerRepository.create({
        name: companyName,
        contactEmail: contactEmail,
        contactPhone: phoneNumber,
        address: address,
        apiKey: apiKey,
        isActive: true,
      });
      mockCustomer = await customerRepository.save(mockCustomer);
      console.log('✅ Mock customer created:', mockCustomer.name);
    }

    // Create Warehouse
    console.log('🏭 Creating warehouse...');
    let warehouse = warehouseRepository.create({
      name: 'Main Distribution Center',
      code: 'WH-001',
      address: '789 Industrial Way, New York, NY 10003',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      country: 'USA',
      isActive: true,
    });
    warehouse = await warehouseRepository.save(warehouse);
    console.log('✅ Warehouse created');

    // Create Warehouse Locations (BRAC system)
    console.log('📍 Creating warehouse locations...');
    const locationCodes = ['A1-01', 'A1-02', 'A1-03', 'B2-01', 'B2-02', 'B2-03', 'C3-01', 'C3-02', 'C3-03'];
    const locations: WarehouseLocation[] = [];
    
    for (const code of locationCodes) {
      const [area, column, rack, bin] = code.split('-');
      const location = locationRepository.create({
        locationCode: code,
        warehouseId: warehouse.id,
        area: area || 'A',
        column: column || '1',
        rack: rack || '1',
        bin: bin || '01',
        maxCapacity: 100,
        currentCapacity: Math.floor(Math.random() * 80),
        utilizationCount: Math.floor(Math.random() * 80),
      });
      const savedLocation = await locationRepository.save(location);
      locations.push(savedLocation);
    }
    console.log('✅ Created', locations.length, 'warehouse locations');

    // Create Purchase Orders
    console.log('📋 Creating purchase orders...');
    const poNumbers = ['PO-2024-001', 'PO-2024-002', 'PO-2024-003'];
    const purchaseOrders: PurchaseOrder[] = [];
    
    for (const poNumber of poNumbers) {
      const poStatus = Math.random() > 0.5 ? 'Completed' : 'Pending';
      const po = purchaseOrderRepository.create({
        poNumber,
        customerId: mockCustomer.id,
        warehouseId: warehouse.id,
        status: poStatus as any,
      });
      const savedPO = await purchaseOrderRepository.save(po);
      purchaseOrders.push(savedPO);

      // Create PO Items
      const skus = ['TSHIRT-BLUE-M', 'TSHIRT-BLUE-L', 'TSHIRT-RED-M', 'JEANS-BLUE-32', 'JEANS-BLUE-34'];
      for (let i = 0; i < 3; i++) {
        const sku = skus[Math.floor(Math.random() * skus.length)];
        const [product, color, size] = sku.split('-');
        const poItem = purchaseOrderItemRepository.create({
          purchaseOrderId: savedPO.id,
          sku,
          size,
          color,
          expectedQuantity: Math.floor(Math.random() * 50) + 10,
          receivedQuantity: poStatus === 'Completed' ? Math.floor(Math.random() * 50) + 10 : 0,
        });
        await purchaseOrderItemRepository.save(poItem);
      }
    }
    console.log('✅ Created', purchaseOrders.length, 'purchase orders');

    // Create Inventory Items
    console.log('📦 Creating inventory items...');
    const inventoryItems: InventoryItem[] = [];
    const productTypes = ['T-Shirt', 'Jeans', 'Hoodie', 'Sweater', 'Jacket'];
    const colors = ['Blue', 'Red', 'Black', 'White', 'Gray'];
    const sizes = ['S', 'M', 'L', 'XL', '32', '34', '36'];

    for (let i = 0; i < 25; i++) {
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const sku = `${productType.toUpperCase().replace(' ', '')}-${color.toUpperCase()}-${size}`;
      
      const location = locations[Math.floor(Math.random() * locations.length)];
      const statuses = ['Received', 'Ready', 'Picked', 'Shipped'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const item = inventoryRepository.create({
        customerId: mockCustomer.id,
        sku,
        size,
        color,
        status: status as any,
        inventoryBarcode: `INV-${Date.now()}-${i}`,
        locationId: location.id,
      });
      const savedItem = await inventoryRepository.save(item);
      inventoryItems.push(savedItem);
    }
    console.log('✅ Created', inventoryItems.length, 'inventory items');

    // Create Shipments
    console.log('🚚 Creating shipments...');
    const shipmentStatuses = ['Pending', 'Ready', 'Shipped', 'Partially Shipped'];
    const shipments: Shipment[] = [];

    for (let i = 0; i < 5; i++) {
      const status = shipmentStatuses[Math.floor(Math.random() * shipmentStatuses.length)];
      const shipment = shipmentRepository.create({
        customerId: mockCustomer.id,
        warehouseId: warehouse.id,
        status: status as any,
        totalQuantity: Math.floor(Math.random() * 10) + 5,
        fulfilledQuantity: status === 'Shipped' ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 5),
      });
      const savedShipment = await shipmentRepository.save(shipment);
      shipments.push(savedShipment);

      // Create Shipment Items
      const selectedItems = inventoryItems.slice(i * 2, i * 2 + 3);
      for (const item of selectedItems) {
        const shipmentItem = shipmentItemRepository.create({
          shipmentId: savedShipment.id,
          sku: item.sku,
          size: item.size,
          color: item.color,
          quantity: Math.floor(Math.random() * 5) + 1,
        });
        await shipmentItemRepository.save(shipmentItem);
      }
    }
    console.log('✅ Created', shipments.length, 'shipments');

    // Create Order Queues
    console.log('📦 Creating order queues...');
    const queueStatuses = ['Pending', 'In Progress', 'Completed'];
    const priorities = ['FIFO', 'Rush', 'Regular'];
    
    for (let i = 0; i < 3; i++) {
      const status = queueStatuses[Math.floor(Math.random() * queueStatuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const shipment = shipments[Math.floor(Math.random() * shipments.length)];

      const queue = orderQueueRepository.create({
        shipmentId: shipment.id,
        warehouseId: warehouse.id,
        priority: priority as any,
        orderType: 'Multiple' as any,
        status: status as any,
        area: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      });
      await orderQueueRepository.save(queue);
    }
    console.log('✅ Created 3 order queues');

    console.log('\n✅ Mock data generation complete!');
    console.log('\n📋 Summary:');
    console.log('   Customer:', mockCustomer.name);
    console.log('   Customer ID:', mockCustomer.id);
    console.log('   Warehouse Locations:', locations.length);
    console.log('   Purchase Orders:', purchaseOrders.length);
    console.log('   Inventory Items:', inventoryItems.length);
    console.log('   Shipments:', shipments.length);
    console.log('   Order Queues: 3');
    console.log('\n💡 You can now test the system with this mock data!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Main function to handle command line arguments
async function main() {
  // Get company name from command line arguments or use default
  const args = process.argv.slice(2);
  const companyName = args.length > 0 ? args.join(' ') : 'Fashion Trends Inc.';
  
  await generateMockDataForCompany(companyName);
}

main();

