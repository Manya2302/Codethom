import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in environment variables!');
  console.error('Please add your MongoDB connection string to Replit Secrets.');
  console.error('You can get a free MongoDB Atlas database at: https://www.mongodb.com/cloud/atlas');
}

let isConnected = false;

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('⚠️  Skipping MongoDB connection - MONGODB_URI not configured');
    return false;
  }

  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return true;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('Please check your MONGODB_URI in Replit Secrets');
    return false;
  }
}

export { mongoose };
