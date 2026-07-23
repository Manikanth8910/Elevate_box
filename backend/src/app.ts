import express from 'express';
import { setupSecurityMiddlewares, apiLimiter } from './middleware/security.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import reviewRoutes from './routes/review.routes';
import auditRoutes from './routes/audit.routes';
import healthRoutes from './routes/health.routes';
import userRoutes from './routes/user.routes';
import profileRoutes from './routes/profile.routes';
import activityRoutes from './routes/activity.routes';

const app = express();

// 1. Core Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Security & Observability
setupSecurityMiddlewares(app);
app.use(requestIdMiddleware);
app.use('/api', apiLimiter);

// 3. Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const reqLogger = (req as any).logger || logger;
    reqLogger.info(`[${req.method}] ${req.originalUrl} - ${res.statusCode} [${ms}ms]`);
  });
  next();
});

// 4. API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/system', auditRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/activity', activityRoutes);

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Endpoint does not exist' });
});

// 6. Global Error Handler
app.use(errorHandler);

export default app;
