import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

/**
 * Database Seed Script
 * Creates default admin user if it doesn't exist
 * 
 * Default credentials:
 * Email: admin@fulfillflow.com
 * Password: admin123
 * 
 * Run with: npx ts-node src/database/seed.ts
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

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@fulfillflow.com' },
    });

    if (existingAdmin) {
      console.log('ℹ️  Default admin user already exists');
      await dataSource.destroy();
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = userRepository.create({
      email: 'admin@fulfillflow.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.SUPER_ADMIN,
      isActive: true,
    });

    await userRepository.save(adminUser);
    console.log('✅ Default admin user created successfully!');
    console.log('\n📋 Default Credentials:');
    console.log('   Email: admin@fulfillflow.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seed();

