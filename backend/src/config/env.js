import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

const requiredEnvs = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.warn(`Warning: Environment variable ${env} is not defined. Using default fallback for development.`);
  }
}

export const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exam-portal',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_for_local_development',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_local_development',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
