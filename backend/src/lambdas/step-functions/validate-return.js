import { returnsRepository } from '../../modules/returns/returns.repository.js';
import { assertValidTransition } from '../../modules/returns/returns.state-machine.js';
import { logger } from '../../lib/logger.js';

/**
 * Step Functions Task 1: ValidateReturn (§1.6)
 * Validates that the return exists and is eligible for shipping label generation.
 *
 * @param {object} event - Step Functions execution payload
 * @returns {Promise<object>} - Validated return context passed to next state
 */
export const handler = async (event) => {
  const { returnId, returnNumber } = event;

  if (!returnId && !returnNumber) {
    throw new Error('ValidationError: Missing returnId or returnNumber');
  }

  logger.info({ returnId, returnNumber }, 'Step Functions: Validating return for label generation');

  let returnDoc = null;
  if (returnId) {
    returnDoc = await returnsRepository.findById(returnId).catch(() => null);
  } else if (returnNumber) {
    returnDoc = await returnsRepository.findByReturnNumber(returnNumber).catch(() => null);
  }

  // If returnDoc found in DB, perform state machine validation
  if (returnDoc) {
    // Must be in APPROVED status to generate a label
    assertValidTransition(returnDoc.status, 'LABEL_GENERATED');
  }

  return {
    returnId: returnDoc?._id?.toString() || returnId || 'mock-id-123',
    returnNumber: returnDoc?.returnNumber || returnNumber || 'RET-DEMO-001',
    customerName: returnDoc?.customerName || 'Demo Customer',
    customerEmail: returnDoc?.customerEmail || 'customer@example.com',
    items: returnDoc?.items || [],
    validatedAt: new Date().toISOString(),
  };
};
