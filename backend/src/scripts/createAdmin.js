import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
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

const generateUniqueOrgId = async () => {
  let isUnique = false;
  let orgId = '';
  while (!isUnique) {
    orgId = 'ORG_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await Organization.findOne({ orgId });
    if (!existing) isUnique = true;
  }
  return orgId;
};

const generateUniqueJoinCode = async () => {
  let isUnique = false;
  let joinCode = '';
  while (!isUnique) {
    joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const existing = await Organization.findOne({ joinCode });
    if (!existing) isUnique = true;
  }
  return joinCode;
};

const createAdmin = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const adminEmail = 'admin@exam.com';
    const adminPassword = 'AdminPassword123!';
    const orgName = 'Main Exam Portal Org';

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`Admin user with email ${adminEmail} already exists!`);
      
      // If it exists, let's make sure it has the ADMIN role
      if (existingUser.role !== ROLES.ADMIN) {
        existingUser.role = ROLES.ADMIN;
        await existingUser.save();
        console.log('Updated existing user role to admin.');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Create Organization first
    const orgId = await generateUniqueOrgId();
    const joinCode = await generateUniqueJoinCode();
    
    console.log('Creating organization...');
    const orgDoc = await Organization.create({
      name: orgName,
      orgId,
      joinCode,
      createdBy: new mongoose.Types.ObjectId() // temporary ID
    });

    console.log(`Organization created: ${orgName} (Join Code: ${joinCode})`);

    // Create Admin User
    console.log('Creating admin user...');
    const adminUser = await User.create({
      fullName: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: ROLES.ADMIN,
      organizationId: orgDoc._id,
      phone: '1234567890',
      isVerified: true,
      isActive: true
    });

    // Update organization's creator ID
    orgDoc.createdBy = adminUser._id;
    await orgDoc.save();

    console.log('==================================================');
    console.log('  ADMIN USER CREATED SUCCESSFULLY');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Organization: ${orgName}`);
    console.log(`  Join Code: ${joinCode}`);
    console.log('==================================================');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Error creating admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
