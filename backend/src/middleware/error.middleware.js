import { AppError } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';

/**
 * Single error-handling boundary across the entire application per §2.
 * Operational AppErrors return safe machine-readable error codes.
 * Unhandled errors are logged with full internal detail and masked from client.
 */
export function errorMiddleware(err, req, res, _next) {
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ code: err.code, path: req.path }, err.message);
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Unknown or programmer error - log internally, mask from client
  logger.error({ path: req.path, error: err }, 'Unhandled error caught by boundary');
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred',
    },
  });
}
