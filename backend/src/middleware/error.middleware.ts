import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const reqLogger = (req as any).logger || logger;
  const requestId = req.headers['x-request-id'];

  if (err instanceof AppError) {
    reqLogger.warn(`[Client Error] ${err.message}`, { 
      statusCode: err.statusCode,
      errorCode: err.name,
      path: req.path 
    });
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      requestId,
    });
  }

  // Handle unforeseen/unhandled errors (e.g. database disconnects, syntax errors)
  reqLogger.error(`[Unhandled Error] ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    body: req.body // Be careful with PII here in production
  });

  // Never leak stack traces in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
    requestId,
    ...(isProduction ? {} : { stack: err.stack })
  });
};
