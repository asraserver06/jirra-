import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const projectRoot = path.resolve(serverRoot, '..');
const projectEnvPath = path.join(projectRoot, '.env');
const serverEnvPath = path.join(serverRoot, '.env');

// The repo-root .env is canonical; server/.env is a fallback when it is absent.
if (fs.existsSync(projectEnvPath)) {
  dotenv.config({ path: projectEnvPath });
}
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}

const requiredSecret = (name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the server environment.`);
  }
  return value;
};

const JWT_SECRET = requiredSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = requiredSecret('JWT_REFRESH_SECRET');
if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
}

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jira-app',
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  CLIENT_URL: process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_USER: (process.env.SMTP_USER || '').trim(),
  SMTP_PASS: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
  EMAIL_FROM: process.env.EMAIL_FROM || (process.env.SMTP_USER ? `TaskFlow <${process.env.SMTP_USER.trim()}>` : 'noreply@taskflow.io'),
};
