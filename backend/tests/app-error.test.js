import { describe, it, expect } from 'vitest';
import { AppError, Errors } from '../src/lib/app-error.js';

describe('AppError & Errors Factory (§2)', () => {
  it('creates an operational AppError with status and code', () => {
    const err = new AppError(404, 'RETURN_NOT_FOUND', 'Return RET-101 was not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('RETURN_NOT_FOUND');
    expect(err.message).toBe('Return RET-101 was not found');
    expect(err.isOperational).toBe(true);
  });

  it('provides pre-defined Errors factory methods with standard HTTP statuses', () => {
    expect(Errors.notFound('Order').statusCode).toBe(404);
    expect(Errors.notFound('Order').code).toBe('NOT_FOUND');

    expect(Errors.unauthorized().statusCode).toBe(401);
    expect(Errors.unauthorized().code).toBe('UNAUTHORIZED');

    expect(Errors.forbidden().statusCode).toBe(403);
    expect(Errors.forbidden().code).toBe('FORBIDDEN');

    expect(Errors.validation('Email required').statusCode).toBe(400);
    expect(Errors.validation('Email required').code).toBe('VALIDATION_ERROR');

    expect(Errors.conflict('Duplicate').statusCode).toBe(409);
    expect(Errors.conflict('Duplicate').code).toBe('CONFLICT');

    expect(Errors.invalidTransition('A', 'B').statusCode).toBe(409);
    expect(Errors.invalidTransition('A', 'B').code).toBe('INVALID_STATE_TRANSITION');
  });
});
