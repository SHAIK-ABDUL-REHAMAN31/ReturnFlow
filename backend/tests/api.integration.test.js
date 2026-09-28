import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { returnsRepository } from '../src/modules/returns/returns.repository.js';

describe('HTTP API & Security Integration Tests', () => {
  describe('GET /health (Container & ALB Health Check §6)', () => {
    it('returns 200 OK with healthy status payload', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('service', 'returnflow-api');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('sets standard security headers from Helmet (§5.4)', async () => {
      const res = await request(app).get('/health');

      expect(res.headers).toHaveProperty('x-dns-prefetch-control');
      expect(res.headers).toHaveProperty('x-frame-options');
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });
  });

  describe('Global 404 & Central Error Handling (§4.11)', () => {
    it('returns structured JSON 404 for undefined routes', async () => {
      const res = await request(app).get('/api/undefined-endpoint-xyz');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toEqual({
        code: 'ROUTE_NOT_FOUND',
        message: 'Cannot GET /api/undefined-endpoint-xyz',
      });
    });
  });

  describe('Zod Request Validation Boundary (validateBody)', () => {
    it('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Jane Doe',
          role: 'CSR',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('email');
    });

    it('rejects registration with short password (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
          name: 'Jane Doe',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('password');
    });

    it('rejects login request with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBeDefined();
    });

    it('rejects return creation with empty item list', async () => {
      const res = await request(app)
        .post('/api/returns')
        .send({
          orderNumber: 'ORD-1234',
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          reason: 'DEFECTIVE',
          items: [], // Violates min(1) constraint
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('items');
    });
  });

  describe('Carrier Webhook Endpoint Security & HMAC Signature (§2 Phase 4)', () => {
    const webhookSecret = process.env.CARRIER_WEBHOOK_SECRET || 'rf_carrier_shared_secret_secure_key_2026';

    it('rejects webhook requests without signature header with 401', async () => {
      const res = await request(app)
        .post('/api/webhooks/carrier')
        .send({
          event: 'CARRIER_PICKUP',
          trackingNumber: 'TRK-12345',
          returnNumber: 'RET-99999',
          timestamp: new Date().toISOString(),
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toContain('signature');
    });

    it('rejects webhook requests with forged or invalid signature with 401', async () => {
      const payload = {
        event: 'CARRIER_PICKUP',
        trackingNumber: 'TRK-12345',
        returnNumber: 'RET-99999',
        timestamp: new Date().toISOString(),
      };

      const res = await request(app)
        .post('/api/webhooks/carrier')
        .set('x-carrier-signature', 'forged-hex-signature-string')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('authenticates valid HMAC SHA-256 signature and proceeds to business logic', async () => {
      // Mock findByReturnNumber so no database wait occurs
      vi.spyOn(returnsRepository, 'findByReturnNumber').mockResolvedValueOnce(null);

      const payload = {
        event: 'CARRIER_PICKUP',
        trackingNumber: 'TRK-VALID-99',
        returnNumber: 'RET-NON-EXISTENT',
        timestamp: new Date().toISOString(),
      };
      const rawBody = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const res = await request(app)
        .post('/api/webhooks/carrier')
        .set('x-carrier-signature', validSignature)
        .send(payload);

      // Signature was accepted! It failed at database lookup with 404 NOT_FOUND, NOT 401 UNAUTHORIZED!
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Global Rate Limiter Headers (§5.3)', () => {
    it('attaches standard rate limit headers to responses', async () => {
      const res = await request(app).get('/health');

      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
      expect(res.headers).toHaveProperty('x-ratelimit-reset');
      expect(Number(res.headers['x-ratelimit-limit'])).toBe(300);
    });
  });

  describe('Direct Evidence Photo Upload (POST /api/returns/:id/photos)', () => {
    it('returns 400 when no file is attached in multipart form', async () => {
      const res = await request(app).post('/api/returns/ret_123/photos');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FILE_REQUIRED');
    });

    it('successfully uploads photo and returns key when return exists', async () => {
      vi.spyOn(returnsRepository, 'findById').mockResolvedValueOnce({
        _id: 'ret_123',
        status: 'PENDING_REVIEW',
        evidencePhotos: [],
      });
      vi.spyOn(returnsRepository, 'addEvidencePhoto').mockResolvedValueOnce({});

      const fakeImageBuffer = Buffer.from('fake image content');
      const res = await request(app)
        .post('/api/returns/ret_123/photos')
        .attach('file', fakeImageBuffer, 'evidence.jpg');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('key');
      expect(res.body.key).toContain('evidence_');
    });
  });

  describe('Customer Tracking Flow & Access Model (§1.4, §5 & §6)', () => {
    it('returns customer-safe tracking data without internal merchant notes', async () => {
      vi.spyOn(returnsRepository, 'findByTrackingToken').mockResolvedValueOnce({
        _id: 'ret_track_1',
        returnNumber: 'RET-9901',
        orderNumber: 'ORD-9021',
        customerName: 'David Miller',
        items: [{ sku: 'AUDIO-WH1000', name: 'Wireless Headphones', price: 299.99, quantity: 1 }],
        status: 'APPROVED',
        reason: 'DEFECTIVE',
        customerNote: 'Customer comment',
        merchantNote: 'INTERNAL SECRET MERCHANT NOTE',
        merchantEvidencePhotos: ['secret.jpg'],
        timeline: [{ status: 'APPROVED', timestamp: new Date(), note: 'Approved' }],
        trackingToken: 'valid-test-token-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).get('/api/returns/track/valid-test-token-123');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('returnNumber', 'RET-9901');
      expect(res.body).toHaveProperty('orderNumber', 'ORD-9021');
      expect(res.body).toHaveProperty('status', 'APPROVED');
      expect(res.body).toHaveProperty('timeline');
      // Never expose merchant internal data
      expect(res.body).not.toHaveProperty('merchantNote');
      expect(res.body).not.toHaveProperty('merchantEvidencePhotos');
    });

    it('returns 404 for nonexistent tracking token', async () => {
      vi.spyOn(returnsRepository, 'findByTrackingToken').mockResolvedValueOnce(null);

      const res = await request(app).get('/api/returns/track/non-existent-random-token');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('looks up returns by orderNumber and email', async () => {
      vi.spyOn(returnsRepository, 'findByOrderAndEmail').mockResolvedValueOnce([
        {
          _id: 'ret_1',
          returnNumber: 'RET-9901',
          orderNumber: 'ORD-9021',
          customerName: 'David Miller',
          items: [{ name: 'Wireless Headphones' }],
          status: 'PENDING_REVIEW',
          refundAmount: 299.99,
          trackingToken: 'valid-token-abc',
          createdAt: new Date(),
        },
      ]);

      const res = await request(app)
        .post('/api/returns/track/lookup')
        .send({ orderNumber: 'ORD-9021', email: 'customer@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('returns');
      expect(res.body.returns).toHaveLength(1);
      expect(res.body.returns[0]).toHaveProperty('trackingToken', 'valid-token-abc');
    });

    it('rejects unauthenticated requests to merchant return detail (GET /api/returns/:id)', async () => {
      const res = await request(app).get('/api/returns/ret_123');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});

