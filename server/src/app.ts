import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { AppError } from './utils/appError.js';
import { sendSuccess } from './utils/response.js';

export const createApp = () => {
  const app = express();

  // Security: Helmet HTTP Headers
  app.use(helmet());

  // Security: Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // Security: CORS Configuration
  const allowedOrigins = [
    ENV.CLIENT_ORIGIN,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow during development
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Basic NoSQL injection sanitizer
  app.use((req: Request, res: Response, next: NextFunction) => {
    const sanitize = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
      return obj;
    };
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    next();
  });

  // Healthcheck endpoint
  app.get('/health', (req, res) => {
    sendSuccess(res, { status: 'healthy', uptime: process.uptime() }, 'Jira API is running smoothly');
  });
  app.get('/api/health', (req, res) => {
    sendSuccess(res, { status: 'healthy', uptime: process.uptime() }, 'Jira API is running smoothly');
  });

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // 404 Fallback
  app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Endpoint ${req.originalUrl} not found on this server`, 404));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
