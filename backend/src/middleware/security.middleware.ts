import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Application } from 'express';

// Standard rate limiter: removed for development
export const apiLimiter = (req: any, res: any, next: any) => next();

// Strict rate limiter for auth routes: removed for development
export const authLimiter = (req: any, res: any, next: any) => next();

export const setupSecurityMiddlewares = (app: Application) => {
  // Helmet secures HTTP headers
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    credentials: true,
  }));
};
