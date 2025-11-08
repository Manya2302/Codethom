import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'customer', 'investor', 'vendor', 'broker', 'user', 'partner'], default: 'customer' },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
  verified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isReraVerified: { type: Boolean, default: false },
  reraId: { type: String, default: null },
  avatar: String,
  phone: String,
  company: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// OTP Schema
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['signup', 'password-reset'], required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now }
});

// Document Schema
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: String,
  size: String,
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  url: String,
  uploadedAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
  method: { type: String, enum: ['PayPal', 'Credit Card', 'Razorpay'] },
  description: String,
  transactionId: String,
  createdAt: { type: Date, default: Date.now }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Verification Schema - stores pending vendor/broker applications
const verificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['vendor', 'broker'], required: true },
  reraId: { type: String, required: true },
  phone: String,
  company: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Create and export models
export const User = mongoose.model('User', userSchema);
export const OTP = mongoose.model('OTP', otpSchema);
export const Document = mongoose.model('Document', documentSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const Verification = mongoose.model('Verification', verificationSchema);
