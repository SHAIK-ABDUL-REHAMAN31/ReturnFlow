export class AppError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} code
   * @param {string} message
   * @param {boolean} isOperational
   */
  constructor(statusCode, code, message, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Pre-defined operational errors used across modules per §2 specification
export const Errors = {
  notFound: (resource) =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),
  invalidTransition: (from, to) =>
    new AppError(409, 'INVALID_STATE_TRANSITION', `Cannot move from ${from} to ${to}`),
  unauthorized: (message = 'Authentication required') =>
    new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'You do not have access to this resource') =>
    new AppError(403, 'FORBIDDEN', message),
  validation: (details) =>
    new AppError(400, 'VALIDATION_ERROR', details),
  conflict: (message) =>
    new AppError(409, 'CONFLICT', message),
  badRequest: (message) =>
    new AppError(400, 'BAD_REQUEST', message),
};
