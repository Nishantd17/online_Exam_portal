import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';

dns.setDefaultResultOrder('ipv4first');

export const connectDB = async () => {
  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI, options);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};
