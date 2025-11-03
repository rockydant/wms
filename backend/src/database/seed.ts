import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

/**
 * Database Seed Script
 * Creates default admin user and test users for each role
 * 
 * Default admin credentials:
 * Email: admin@fulfillflow.com
 * Password: admin123
 * 
 * Test users (all with password: test123):
 * - superadmin@fulfillflow.com (Super Admin)
 * - inventory@fulfillflow.com (Inventory Leader)
 * - receiving@fulfillflow.com (Receiving)
 * - picking@fulfillflow.com (Picking)
 * - delivery@fulfillflow.com (Delivery Leader)
 * - qc@fulfillflow.com (QC)
 * - packaging@fulfillflow.com (Packaging)
 * - customer@fulfillflow.com (Customer)
 * 
 * Run with: npm run seed
 */
async function seed() {
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

    const userRepository = dataSource.getRepository(User);
    const defaultPassword = 'admin123';
    const testPassword = 'test123';

    // Test users configuration
    const testUsers = [
      {
        email: 'admin@fulfillflow.com',
        password: defaultPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: Role.SUPER_ADMIN,
      },
      {
        email: 'superadmin@fulfillflow.com',
        password: testPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: Role.SUPER_ADMIN,
      },
      {
        email: 'inventory@fulfillflow.com',
        password: testPassword,
        firstName: 'Inventory',
        lastName: 'Leader',
        role: Role.INVENTORY_LEADER,
      },
      {
        email: 'receiving@fulfillflow.com',
        password: testPassword,
        firstName: 'Receiving',
        lastName: 'Staff',
        role: Role.RECEIVING,
      },
      {
        email: 'picking@fulfillflow.com',
        password: testPassword,
        firstName: 'Picking',
        lastName: 'Staff',
        role: Role.PICKING,
      },
      {
        email: 'delivery@fulfillflow.com',
        password: testPassword,
        firstName: 'Delivery',
        lastName: 'Leader',
        role: Role.DELIVERY_LEADER,
      },
      {
        email: 'qc@fulfillflow.com',
        password: testPassword,
        firstName: 'Quality',
        lastName: 'Control',
        role: Role.QC,
      },
      {
        email: 'packaging@fulfillflow.com',
        password: testPassword,
        firstName: 'Packaging',
        lastName: 'Staff',
        role: Role.PACKAGING,
      },
      {
        email: 'customer@fulfillflow.com',
        password: testPassword,
        firstName: 'Test',
        lastName: 'Customer',
        role: Role.CUSTOMER,
      },
    ];

    console.log('\n🔨 Starting user seeding...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⏭️  Skipped: ${userData.email} (${userData.role}) - already exists`);
        skippedCount++;
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = userRepository.create({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: true,
      });

      await userRepository.save(user);
      console.log(`✅ Created: ${userData.email} (${userData.role})`);
      createdCount++;
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Skipped: ${skippedCount} users`);
    console.log(`   Total: ${testUsers.length} users\n`);

    console.log('📋 Test User Credentials:\n');
    testUsers.forEach(user => {
      const password = user.email === 'admin@fulfillflow.com' ? defaultPassword : testPassword;
      console.log(`   ${user.email} / ${password} (${user.role})`);
    });

    console.log('\n⚠️  IMPORTANT: Change default passwords after first login!\n');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();
