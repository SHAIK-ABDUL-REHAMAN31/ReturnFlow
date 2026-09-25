import crypto from 'crypto';
import { returnsRepository } from '../returns/returns.repository.js';
import { assertValidTransition } from '../returns/returns.state-machine.js';
import { snsService } from '../../lib/sns-client.js';
import { Errors } from '../../lib/app-error.js';
import { logger } from '../../lib/logger.js';

const WEBHOOK_SECRET = process.env.CARRIER_WEBHOOK_SECRET || 'rf_carrier_shared_secret_secure_key_2026';

export class CarrierWebhookService {
  /**
   * Verifies HMAC signature on incoming carrier callback payloads (§5.3).
   * Prevents unauthorized party from triggering fake transit or delivery events.
   */
  verifySignature(signatureHeader, rawBodyString) {
    if (!signatureHeader) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBodyString)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signatureHeader.replace('sha256=', ''));

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  async processCarrierEvent(eventData) {
    const { returnNumber, event, trackingNumber, carrier, location, note } = eventData;

    const returnDoc = await returnsRepository.findByReturnNumber(returnNumber);
    if (!returnDoc) {
      throw Errors.notFound(`Return with number ${returnNumber}`);
    }

    let targetStatus = null;
    let timelineNote = '';

    if (event === 'CARRIER_PICKUP' || event === 'IN_TRANSIT') {
      targetStatus = 'IN_TRANSIT';
      timelineNote = `Carrier ${carrier} scanned parcel at ${location} (Tracking: ${trackingNumber}). ${note || ''}`.trim();
    } else if (event === 'DELIVERED_TO_DOCK') {
      targetStatus = 'RECEIVED';
      timelineNote = `Delivered to warehouse dock by ${carrier} (${location}). Ready for physical inspection.`.trim();
    } else {
      throw Errors.badRequest(`Unknown carrier event type: ${event}`);
    }

    // Idempotent check: if already at target status, return existing
    if (returnDoc.status === targetStatus) {
      logger.info({ returnNumber, status: returnDoc.status }, 'Carrier webhook: status already achieved (idempotent no-op)');
      return { return: returnDoc, processed: false, reason: 'ALREADY_AT_STATUS' };
    }

    // State machine boundary check (§4.4)
    assertValidTransition(returnDoc.status, targetStatus);

    const updated = await returnsRepository.updateStatus(
      returnDoc._id.toString(),
      targetStatus,
      {},
      {
        status: targetStatus,
        timestamp: new Date(),
        note: timelineNote,
        actor: `CARRIER_${carrier}`,
      }
    );

    await snsService.publish('carrier.status_update', {
      returnId: returnDoc._id.toString(),
      returnNumber,
      event,
      newStatus: targetStatus,
      trackingNumber,
    });

    logger.info({ returnNumber, targetStatus }, 'Processed carrier status transition successfully');

    return {
      return: updated,
      processed: true,
      newStatus: targetStatus,
    };
  }
}

export const carrierWebhookService = new CarrierWebhookService();
