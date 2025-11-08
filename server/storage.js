import { User, Document, Transaction, Notification, OTP, Verification } from "../shared/schema.js";
import bcrypt from "bcryptjs";

export class MongoStorage {
  // User methods
  async getUser(id) {
    return await User.findById(id).select('-password');
  }

  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async createUser(userData, skipPasswordHash = false) {
    const password = skipPasswordHash 
      ? userData.password 
      : await bcrypt.hash(userData.password, 10);
    const user = new User({
      ...userData,
      password,
    });
    return await user.save();
  }

  async updateUser(id, updates) {
    return await User.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true }).select('-password');
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  async getAllUsers(filters = {}) {
    return await User.find(filters).select('-password');
  }

  // OTP methods
  async createOTP(otpData) {
    await OTP.deleteMany({ email: otpData.email, type: otpData.type });
    const otp = new OTP(otpData);
    return await otp.save();
  }

  async getOTP(email, code, type) {
    return await OTP.findOne({ 
      email, 
      code, 
      type,
      expiresAt: { $gt: new Date() }
    });
  }

  async getOTPByEmail(email, type) {
    return await OTP.findOne({ 
      email, 
      type,
      expiresAt: { $gt: new Date() }
    });
  }

  async incrementOTPAttempt(id) {
    return await OTP.findByIdAndUpdate(
      id, 
      { $inc: { attempts: 1 } }, 
      { new: true }
    );
  }

  async deleteOTP(id) {
    return await OTP.findByIdAndDelete(id);
  }

  async deleteOTPsByEmail(email) {
    return await OTP.deleteMany({ email });
  }

  // Document methods
  async createDocument(docData) {
    const document = new Document(docData);
    return await document.save();
  }

  async getDocumentsByUser(userId) {
    return await Document.find({ userId });
  }

  async updateDocumentStatus(id, status) {
    return await Document.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteDocument(id) {
    return await Document.findByIdAndDelete(id);
  }

  // Transaction methods
  async createTransaction(txnData) {
    const transaction = new Transaction(txnData);
    return await transaction.save();
  }

  async getTransactionsByUser(userId) {
    return await Transaction.find({ userId }).sort({ createdAt: -1 });
  }

  async updateTransaction(id, updates) {
    return await Transaction.findByIdAndUpdate(id, updates, { new: true });
  }

  // Notification methods
  async createNotification(notifData) {
    const notification = new Notification(notifData);
    return await notification.save();
  }

  async getNotificationsByUser(userId) {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  }

  async markNotificationAsRead(id) {
    return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
  }

  async markAllNotificationsAsRead(userId) {
    return await Notification.updateMany({ userId, read: false }, { read: true });
  }

  async deleteNotification(id) {
    return await Notification.findByIdAndDelete(id);
  }

  // Verification methods
  async createVerification(verificationData) {
    // Hash password to avoid storing plaintext in database
    const hashedPassword = await bcrypt.hash(verificationData.password, 10);
    const verification = new Verification({
      ...verificationData,
      password: hashedPassword,
    });
    return await verification.save();
  }

  async getAllVerifications(filters = {}) {
    return await Verification.find(filters).sort({ submittedAt: -1 });
  }

  async getVerification(id) {
    return await Verification.findById(id);
  }

  async getVerificationByEmail(email) {
    return await Verification.findOne({ email });
  }

  async updateVerification(id, updates) {
    return await Verification.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteVerification(id) {
    return await Verification.findByIdAndDelete(id);
  }
}

export const storage = new MongoStorage();
