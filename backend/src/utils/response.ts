import { Response } from 'express';
import { APIResponse } from '@document-approval/shared';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public data: any = null
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  error: any = null
) => {
  const response: APIResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    error,
    timestamp: new Date().toISOString(),
    requestId: res.locals.requestId || 'unknown',
  };
  return res.status(statusCode).json(response);
};
