import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { ROLES } from '../constants/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('Error: MONGODB_URI is not defined in .env');
  process.exit(1);
}

const createSuperAdmin = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const superAdminEmail = 'principal@exam.com';
    const superAdminPassword = 'PrincipalPassword123!';

    // Check if user already exists
    const existingUser = await User.findOne({ email: superAdminEmail });
    if (existingUser) {
      console.log(`Super Admin user with email ${superAdminEmail} already exists!`);
      
      // If it exists, let's make sure it has the SUPER_ADMIN role
      if (existingUser.role !== ROLES.SUPER_ADMIN) {
        existingUser.role = ROLES.SUPER_ADMIN;
        await existingUser.save();
        console.log('Updated existing user role to super_admin.');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Create Super Admin User
    console.log('Creating super admin (Principal) user...');
    await User.create({
      fullName: 'Principal / System Admin',
      email: superAdminEmail,
      password: superAdminPassword,
      role: ROLES.SUPER_ADMIN,
      phone: '9999999999',
      isVerified: true,
      isActive: true
    });

    console.log('==================================================');
    console.log('  SUPER ADMIN (PRINCIPAL) CREATED SUCCESSFULLY');
    console.log(`  Email: ${superAdminEmail}`);
    console.log(`  Password: ${superAdminPassword}`);
    console.log(`  Role: ${ROLES.SUPER_ADMIN}`);
    console.log('==================================================');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Error creating super admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createSuperAdmin();
