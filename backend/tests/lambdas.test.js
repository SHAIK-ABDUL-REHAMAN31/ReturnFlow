import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { handler as carrierWebhookHandler } from '../src/lambdas/carrier-webhook-handler.js';
import { handler as validateReturnHandler } from '../src/lambdas/step-functions/validate-return.js';
import { handler as generateLabelHandler } from '../src/lambdas/step-functions/generate-label.js';
import { handler as uploadS3Handler } from '../src/lambdas/step-functions/upload-s3.js';
import { handler as updateStatusHandler } from '../src/lambdas/step-functions/update-status.js';
import { sqsClient, s3Client } from '../src/config/aws.js';

describe('Serverless Lambda Extensions (§2 Phase 4)', () => {
  const secret = process.env.CARRIER_WEBHOOK_SECRET || 'rf_carrier_shared_secret_secure_key_2026';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Gateway Carrier Webhook Lambda Receiver', () => {
    it('returns 401 when signature header is missing', async () => {
      const event = {
        headers: {},
        body: JSON.stringify({ returnNumber: 'RET-100', event: 'CARRIER_PICKUP', trackingNumber: 'TRK-100' }),
      };

      const res = await carrierWebhookHandler(event, { awsRequestId: 'test-req-1' });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 on invalid/forged HMAC signature', async () => {
      const event = {
        headers: {
          'x-carrier-signature': 'bad_signature_hex_1234567890abcdef',
        },
        body: JSON.stringify({ returnNumber: 'RET-100', event: 'CARRIER_PICKUP', trackingNumber: 'TRK-100' }),
      };

      const res = await carrierWebhookHandler(event, { awsRequestId: 'test-req-2' });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('accepts valid HMAC signature and enqueues event to SQS', async () => {
      const payload = {
        returnNumber: 'RET-901',
        event: 'CARRIER_PICKUP',
        trackingNumber: '1Z999AA10123456784',
      };
      const rawBody = JSON.stringify(payload);
      const validSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      vi.spyOn(sqsClient, 'send').mockResolvedValueOnce({ MessageId: 'msg-12345' });

      const event = {
        headers: {
          'x-carrier-signature': validSig,
        },
        body: rawBody,
      };

      const res = await carrierWebhookHandler(event, { awsRequestId: 'test-req-3' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('ACCEPTED');
      expect(body.returnNumber).toBe('RET-901');
      expect(sqsClient.send).toHaveBeenCalled();
    });

    it('decodes base64-encoded request bodies properly', async () => {
      const payload = {
        returnNumber: 'RET-902',
        event: 'IN_TRANSIT',
        trackingNumber: '1Z999AA10123456785',
      };
      const rawBody = JSON.stringify(payload);
      const base64Body = Buffer.from(rawBody).toString('base64');
      const validSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      vi.spyOn(sqsClient, 'send').mockResolvedValueOnce({ MessageId: 'msg-12346' });

      const event = {
        headers: {
          'x-carrier-signature': validSig,
        },
        isBase64Encoded: true,
        body: base64Body,
      };

      const res = await carrierWebhookHandler(event, { awsRequestId: 'test-req-4' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('ACCEPTED');
      expect(body.returnNumber).toBe('RET-902');
    });
  });

  describe('Step Functions Visual Workflow Task Handlers (§1.6)', () => {
    it('ValidateReturn: rejects event without returnId or returnNumber', async () => {
      await expect(validateReturnHandler({})).rejects.toThrow('ValidationError');
    });

    it('ValidateReturn: returns validated context for next task', async () => {
      const res = await validateReturnHandler({
        returnId: 'ret_123',
        returnNumber: 'RET-888',
      });

      expect(res.returnId).toBe('ret_123');
      expect(res.returnNumber).toBe('RET-888');
      expect(res).toHaveProperty('validatedAt');
    });

    it('GenerateLabel: generates tracking number and in-memory PDF data', async () => {
      const input = {
        returnId: 'ret_123',
        returnNumber: 'RET-888',
        customerName: 'Alice Smith',
      };

      const res = await generateLabelHandler(input);
      expect(res.trackingNumber).toMatch(/^1Z[A-F0-9]{16}$/);
      expect(res.carrier).toBe('UPS');
      expect(res.labelKey).toContain('labels/RET-888');
      expect(res.pdfBufferBase64).toBeDefined();
    });

    it('UploadToS3: uploads label to S3 and strips bulky base64 buffer from state', async () => {
      vi.spyOn(s3Client, 'send').mockResolvedValueOnce({});

      const input = {
        returnId: 'ret_123',
        returnNumber: 'RET-888',
        trackingNumber: '1Z1234567890ABCDEF',
        carrier: 'UPS',
        labelKey: 'labels/RET-888.pdf',
        pdfBufferBase64: Buffer.from('%PDF-1.4 test').toString('base64'),
      };

      const res = await uploadS3Handler(input);
      expect(res.s3Key).toBe('labels/RET-888.pdf');
      expect(res.s3Uri).toContain('labels/RET-888.pdf');
      // Buffer must be stripped to prevent Step Functions 256KB payload limit
      expect(res.pdfBufferBase64).toBeUndefined();
    });

    it('UpdateStatus: outputs final payload ready for SNS event publish', async () => {
      const input = {
        returnId: 'ret_123',
        returnNumber: 'RET-888',
        trackingNumber: '1Z1234567890ABCDEF',
        labelKey: 'labels/RET-888.pdf',
        carrier: 'UPS',
      };

      const res = await updateStatusHandler(input);
      expect(res.status).toBe('LABEL_GENERATED');
      expect(res.event).toBe('LABEL_READY');
      expect(res.returnNumber).toBe('RET-888');
      expect(res).toHaveProperty('completedAt');
    });
  });
});
