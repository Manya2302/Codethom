import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../shared/schema.js';

const MONGODB_URI = process.env.MONGODB_URI;
const SUPERADMIN_EMAIL = 'mominsamir8044@gmail.com';
const SUPERADMIN_PASSWORD = 'superadmin@123';

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: SUPERADMIN_EMAIL });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin user already exists');
      
      // Update to superadmin role if not already
      if (existingSuperAdmin.role !== 'superadmin') {
        existingSuperAdmin.role = 'superadmin';
        existingSuperAdmin.status = 'active';
        existingSuperAdmin.verified = true;
        existingSuperAdmin.isEmailVerified = true;
        await existingSuperAdmin.save();
        console.log('✅ Updated existing user to super admin');
      }
    } else {
      // Create new super admin user
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
      
      const superAdmin = new User({
        name: 'Super Admin',
        email: SUPERADMIN_EMAIL,
        password: hashedPassword,
        role: 'superadmin',
        status: 'active',
        verified: true,
        isEmailVerified: true,
      });

      await superAdmin.save();
      console.log('✅ Super admin user created successfully');
    }

    console.log('📧 Email:', SUPERADMIN_EMAIL);
    console.log('🔐 Role: superadmin');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
