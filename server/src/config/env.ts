import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jira-app',
  JWT_SECRET: process.env.JWT_SECRET || 'jira-super-secure-jwt-secret-key-32-chars-min',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'jira-refresh-jwt-secret-key-at-least-32-chars-long',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
};
