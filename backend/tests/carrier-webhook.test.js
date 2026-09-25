import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { carrierWebhookService } from '../src/modules/webhooks/carrier.service.js';
import { returnsRepository } from '../src/modules/returns/returns.repository.js';
import { snsService } from '../src/lib/sns-client.js';

describe('Carrier Webhook Engine (§2 Phase 4)', () => {
  const secret = process.env.CARRIER_WEBHOOK_SECRET || 'rf_carrier_shared_secret_secure_key_2026';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('HMAC Signature Verification', () => {
    it('successfully verifies a valid HMAC SHA256 signature', () => {
      const rawPayload = JSON.stringify({ returnNumber: 'RET-80102', event: 'CARRIER_PICKUP' });
      const validSignature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

      const isVerified = carrierWebhookService.verifySignature(`sha256=${validSignature}`, rawPayload);
      expect(isVerified).toBe(true);
    });

    it('rejects tampered or invalid signature', () => {
      const rawPayload = JSON.stringify({ returnNumber: 'RET-80102', event: 'CARRIER_PICKUP' });
      const fakeSignature = 'sha256=1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff';

      const isVerified = carrierWebhookService.verifySignature(fakeSignature, rawPayload);
      expect(isVerified).toBe(false);
    });
  });

  describe('Lifecycle State Transitions via Carrier Callbacks', () => {
    it('advances return from LABEL_GENERATED to IN_TRANSIT on CARRIER_PICKUP', async () => {
      const mockReturn = {
        _id: '65e9f8a1b2c3d4e5f6789012',
        returnNumber: 'RET-80102',
        status: 'LABEL_GENERATED',
      };

      vi.spyOn(returnsRepository, 'findByReturnNumber').mockResolvedValue(mockReturn);
      vi.spyOn(returnsRepository, 'updateStatus').mockResolvedValue({
        ...mockReturn,
        status: 'IN_TRANSIT',
      });
      vi.spyOn(snsService, 'publish').mockResolvedValue();

      const result = await carrierWebhookService.processCarrierEvent({
        returnNumber: 'RET-80102',
        event: 'CARRIER_PICKUP',
        trackingNumber: '1Z999AA10123456784',
        carrier: 'UPS',
        location: 'Dallas Hub, TX',
      });

      expect(result.processed).toBe(true);
      expect(result.newStatus).toBe('IN_TRANSIT');
      expect(returnsRepository.updateStatus).toHaveBeenCalledWith(
        mockReturn._id,
        'IN_TRANSIT',
        {},
        expect.objectContaining({ status: 'IN_TRANSIT', actor: 'CARRIER_UPS' })
      );
    });

    it('handles idempotent delivery gracefully if return is already at target status', async () => {
      const mockReturn = {
        _id: '65e9f8a1b2c3d4e5f6789012',
        returnNumber: 'RET-80102',
        status: 'IN_TRANSIT',
      };

      vi.spyOn(returnsRepository, 'findByReturnNumber').mockResolvedValue(mockReturn);
      const updateSpy = vi.spyOn(returnsRepository, 'updateStatus');

      const result = await carrierWebhookService.processCarrierEvent({
        returnNumber: 'RET-80102',
        event: 'IN_TRANSIT',
        trackingNumber: '1Z999AA10123456784',
        carrier: 'UPS',
        location: 'Dallas Hub, TX',
      });

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('ALREADY_AT_STATUS');
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('throws 409 error on illegal carrier transition attempt', async () => {
      // Trying to trigger dock delivery on an unapproved return
      const mockReturn = {
        _id: '65e9f8a1b2c3d4e5f6789012',
        returnNumber: 'RET-80101',
        status: 'PENDING_REVIEW',
      };

      vi.spyOn(returnsRepository, 'findByReturnNumber').mockResolvedValue(mockReturn);

      await expect(
        carrierWebhookService.processCarrierEvent({
          returnNumber: 'RET-80101',
          event: 'DELIVERED_TO_DOCK',
          trackingNumber: '1Z999AA10123456784',
          carrier: 'UPS',
        })
      ).rejects.toThrow();
    });
  });
});
