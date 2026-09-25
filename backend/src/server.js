import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { cacheService } from './lib/cache.service.js';
import { startWorkerLoops, stopWorkerLoops } from './workers/worker-runner.js';
import { logger } from './lib/logger.js';

let server;

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start SQS background worker loops (§1.3, §4.5)
    await startWorkerLoops();

    // 3. Start HTTP Listener
    server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `ReturnFlow Backend running at http://localhost:${env.PORT}`
      );
    });
  } catch (err) {
    logger.error({ error: err }, 'Bootstrap failure: shutting down');
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Received termination signal, starting graceful shutdown');

  if (server) {
    stopWorkerLoops();
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      await cacheService.disconnect();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });

    // Force close if graceful cleanup takes too long
    setTimeout(() => {
      logger.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ error: err }, 'Uncaught Exception — exiting');
  process.exit(1);
});

bootstrap();
