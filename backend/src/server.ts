import 'dotenv/config'; // Load .env
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const PORT = config.PORT || 6222;

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT} in ${config.NODE_ENV} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    logger.info('Process terminated.');
  });
});
