# 👥 Test Users by Role

This document lists all test users created by the seed script for testing different roles in the FulfillFlow WMS system.

## 📋 User Credentials

All test users (except admin) use password: **`test123`**

### 🔑 Admin User
- **Email:** `admin@fulfillflow.com`
- **Password:** `admin123`
- **Role:** Super Admin
- **Name:** Admin User

### 👨‍💼 Test Users by Role

#### 1. Super Admin
- **Email:** `superadmin@fulfillflow.com`
- **Password:** `test123`
- **Role:** Super Admin
- **Name:** Super Admin

#### 2. Inventory Leader
- **Email:** `inventory@fulfillflow.com`
- **Password:** `test123`
- **Role:** Inventory Leader
- **Name:** Inventory Leader

#### 3. Receiving Staff
- **Email:** `receiving@fulfillflow.com`
- **Password:** `test123`
- **Role:** Receiving
- **Name:** Receiving Staff

#### 4. Picking Staff
- **Email:** `picking@fulfillflow.com`
- **Password:** `test123`
- **Role:** Picking
- **Name:** Picking Staff

#### 5. Delivery Leader
- **Email:** `delivery@fulfillflow.com`
- **Password:** `test123`
- **Role:** Delivery Leader
- **Name:** Delivery Leader

#### 6. Quality Control
- **Email:** `qc@fulfillflow.com`
- **Password:** `test123`
- **Role:** QC
- **Name:** Quality Control

#### 7. Packaging Staff
- **Email:** `packaging@fulfillflow.com`
- **Password:** `test123`
- **Role:** Packaging
- **Name:** Packaging Staff

#### 8. Customer
- **Email:** `customer@fulfillflow.com`
- **Password:** `test123`
- **Role:** Customer
- **Name:** Test Customer

## 🚀 How to Create Test Users

Run the seed script:

```bash
cd backend
npm run seed
```

Or if running in Docker:

```bash
docker-compose exec backend npm run seed
```

## 📝 Notes

- The seed script will skip users that already exist (by email)
- All users are created as active (`isActive: true`)
- Passwords are securely hashed using bcrypt
- Change default passwords after first login for security

## 🔐 Role Permissions

Each role has different permissions in the system:

- **Super Admin**: Full system access
- **Inventory Leader**: Oversees receiving & picking
- **Receiving**: Processes inbound shipments
- **Picking**: Retrieves items per order queue
- **Delivery Leader**: Oversees QC & packaging
- **QC**: Validates item correctness
- **Packaging**: Finalizes and ships packages
- **Customer**: Manages SKUs, shipments, and API requests
