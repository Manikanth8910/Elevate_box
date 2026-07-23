import winston from 'winston';

const { combine, timestamp, json, errors } = winston.format;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'document-approval-api' },
  transports: [
    new winston.transports.Console(),
    // In production, we would add file transports or log shippers (e.g., Datadog, ELK) here
  ],
});
