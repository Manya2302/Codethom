import { connectDB } from './db.js';
import { User } from '../shared/schema.js';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    await connectDB();
    
    const adminEmail = 'admin@admin.com';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@admin.com');
      console.log('Password: admin');
      process.exit(0);
    }
    
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    const admin = new User({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      verified: true,
    });
    
    await admin.save();
    
    console.log('Admin user created successfully');
    console.log('Email: admin@admin.com');
    console.log('Password: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
