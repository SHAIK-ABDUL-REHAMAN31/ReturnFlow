import { describe, it, expect } from 'vitest';
import {
  TRANSITIONS,
  isValidTransition,
  assertValidTransition,
} from '../src/modules/returns/returns.state-machine.js';
import { AppError } from '../src/lib/app-error.js';

describe('Returns State Machine (§4.4)', () => {
  it('should define exhaustive transitions for every return status', () => {
    const allStatuses = [
      'PENDING_REVIEW',
      'APPROVED',
      'LABEL_GENERATED',
      'IN_TRANSIT',
      'RECEIVED',
      'REFUNDED',
      'REJECTED',
    ];

    expect(Object.keys(TRANSITIONS).sort()).toEqual(allStatuses.sort());
  });

  describe('Legal Transitions (Happy Paths)', () => {
    it('allows PENDING_REVIEW -> APPROVED and PENDING_REVIEW -> REJECTED', () => {
      expect(isValidTransition('PENDING_REVIEW', 'APPROVED')).toBe(true);
      expect(isValidTransition('PENDING_REVIEW', 'REJECTED')).toBe(true);
      expect(() => assertValidTransition('PENDING_REVIEW', 'APPROVED')).not.toThrow();
      expect(() => assertValidTransition('PENDING_REVIEW', 'REJECTED')).not.toThrow();
    });

    it('allows APPROVED -> LABEL_GENERATED', () => {
      expect(isValidTransition('APPROVED', 'LABEL_GENERATED')).toBe(true);
      expect(() => assertValidTransition('APPROVED', 'LABEL_GENERATED')).not.toThrow();
    });

    it('allows LABEL_GENERATED -> IN_TRANSIT', () => {
      expect(isValidTransition('LABEL_GENERATED', 'IN_TRANSIT')).toBe(true);
      expect(() => assertValidTransition('LABEL_GENERATED', 'IN_TRANSIT')).not.toThrow();
    });

    it('allows IN_TRANSIT -> RECEIVED', () => {
      expect(isValidTransition('IN_TRANSIT', 'RECEIVED')).toBe(true);
      expect(() => assertValidTransition('IN_TRANSIT', 'RECEIVED')).not.toThrow();
    });

    it('allows RECEIVED -> REFUNDED', () => {
      expect(isValidTransition('RECEIVED', 'REFUNDED')).toBe(true);
      expect(() => assertValidTransition('RECEIVED', 'REFUNDED')).not.toThrow();
    });
  });

  describe('Illegal Transitions (Violations)', () => {
    it('rejects jumping from PENDING_REVIEW directly to REFUNDED', () => {
      expect(isValidTransition('PENDING_REVIEW', 'REFUNDED')).toBe(false);
      expect(() => assertValidTransition('PENDING_REVIEW', 'REFUNDED')).toThrow(AppError);
    });

    it('rejects jumping from APPROVED directly to RECEIVED', () => {
      expect(isValidTransition('APPROVED', 'RECEIVED')).toBe(false);
      expect(() => assertValidTransition('APPROVED', 'RECEIVED')).toThrow(AppError);
    });

    it('terminal state REJECTED cannot transition anywhere', () => {
      expect(TRANSITIONS.REJECTED).toEqual([]);
      expect(isValidTransition('REJECTED', 'APPROVED')).toBe(false);
      expect(() => assertValidTransition('REJECTED', 'APPROVED')).toThrow(AppError);
    });

    it('terminal state REFUNDED cannot transition anywhere (prevents double refund)', () => {
      expect(TRANSITIONS.REFUNDED).toEqual([]);
      expect(isValidTransition('REFUNDED', 'APPROVED')).toBe(false);
      expect(isValidTransition('REFUNDED', 'RECEIVED')).toBe(false);
      expect(() => assertValidTransition('REFUNDED', 'REFUNDED')).toThrow(AppError);
    });

    it('throws AppError with 409 code on invalid transition', () => {
      try {
        assertValidTransition('PENDING_REVIEW', 'IN_TRANSIT');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe('INVALID_STATE_TRANSITION');
      }
    });
  });
});
