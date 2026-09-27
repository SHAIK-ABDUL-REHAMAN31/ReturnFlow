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
});
