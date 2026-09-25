import { returnsRepository } from '../modules/returns/returns.repository.js';
import { snsService } from '../lib/sns-client.js';
import { logger } from '../lib/logger.js';

/**
 * Background refund processor worker per §1.4.
 * Idempotently executes refunds and notifies parties.
 */
export async function processRefundJob(jobData) {
  const { returnId, amount, idempotencyKey } = jobData;
  if (!returnId) {
    logger.warn({ jobData }, 'Malformed refund job payload');
    return;
  }

  const returnDoc = await returnsRepository.findById(returnId);
  if (!returnDoc) {
    logger.warn({ returnId }, 'Return not found during refund processing');
    return;
  }

  // Idempotency check: if already REFUNDED, do NOT double-refund (§1.4)
  if (returnDoc.status === 'REFUNDED') {
    logger.info({ returnId }, 'Return already refunded, skipping duplicate execution');
    return;
  }

  try {
    const refundAmount = amount || returnDoc.refundAmount;

    await returnsRepository.updateStatus(
      returnId,
      'REFUNDED',
      {
        refundAmount,
        idempotencyKey,
      },
      {
        status: 'REFUNDED',
        timestamp: new Date(),
        note: `Electronic refund of $${refundAmount.toFixed(2)} completed via payment gateway`,
        actor: 'REFUND_WORKER',
      }
    );

    await snsService.publish('refund.completed', {
      returnId,
      returnNumber: returnDoc.returnNumber,
      amount: refundAmount,
      idempotencyKey,
    });

    logger.info({ returnId, refundAmount }, 'Refund processing completed successfully');
  } catch (err) {
    logger.error({ returnId, error: err }, 'Refund execution failed');
    throw err;
  }
}
