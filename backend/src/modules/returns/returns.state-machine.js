import { Errors } from '../../lib/app-error.js';

// Table-driven, exhaustive state machine transition matrix per §4.4
export const TRANSITIONS = Object.freeze({
  PENDING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['LABEL_GENERATED', 'REJECTED'],
  LABEL_GENERATED: ['IN_TRANSIT', 'REJECTED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: ['REFUNDED', 'REJECTED'],
  REJECTED: [],
  REFUNDED: [],
});

export function isValidTransition(current, next) {
  return TRANSITIONS[current]?.includes(next) ?? false;
}

export function assertValidTransition(current, next) {
  if (!isValidTransition(current, next)) {
    throw Errors.invalidTransition(current, next);
  }
}
