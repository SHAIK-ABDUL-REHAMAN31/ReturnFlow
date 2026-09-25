import crypto from 'crypto';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const WEBHOOK_SECRET = process.env.CARRIER_WEBHOOK_SECRET || 'rf_carrier_shared_secret_secure_key_2026';

/**
 * AWS Lambda Handler for API Gateway Carrier Webhook Integration (§2 Phase 4).
 * Kept isolated from the main ECS API to protect dashboard resources from external webhook spikes.
 *
 * Verifies timing-safe HMAC SHA-256 signature and decouples event processing via SQS.
 *
 * @param {object} event - AWS API Gateway Proxy Request Event
 * @param {object} context - Lambda Execution Context
 * @returns {Promise<{ statusCode: number, headers: object, body: string }>}
 */
export const handler = async (event, context = {}) => {
  const requestId = context.awsRequestId || `local-req-${Date.now()}`;
  const headers = event.headers || {};

  // Case-insensitive header lookup for signature
  const signatureHeader =
    headers['x-carrier-signature'] ||
    headers['X-Carrier-Signature'] ||
    headers['x-webhook-token'];

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf-8')
    : event.body || '';

  // 1. Timing-safe HMAC signature verification (§5.3)
  if (!signatureHeader || !rawBody) {
    logger.warn({ requestId }, 'Rejected unsigned carrier webhook request');
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing carrier webhook signature',
        },
      }),
    };
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signatureHeader.replace('sha256=', ''));

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    logger.warn({ requestId }, 'Rejected carrier webhook with invalid HMAC signature');
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing carrier webhook signature',
        },
      }),
    };
  }

  // 2. Parse and validate JSON payload
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          code: 'BAD_REQUEST',
          message: 'Malformed JSON payload in request body',
        },
      }),
    };
  }

  if (!payload.returnNumber || !payload.event || !payload.trackingNumber) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required carrier event fields (returnNumber, event, trackingNumber)',
        },
      }),
    };
  }

  // 3. Decouple via SQS for asynchronous, resilient processing
  try {
    const queueUrl = process.env.SQS_CARRIER_QUEUE_URL || env.SQS_LABEL_QUEUE_URL;
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        ...payload,
        source: 'API_GATEWAY_LAMBDA',
        receivedAt: new Date().toISOString(),
        requestId,
      }),
    });
    await sqsClient.send(command);

    logger.info(
      { returnNumber: payload.returnNumber, event: payload.event, requestId },
      'Successfully queued carrier webhook event via Lambda'
    );
  } catch (err) {
    logger.warn(
      { error: err.message, returnNumber: payload.returnNumber },
      'SQS enqueue failed (degraded/mock mode)'
    );
  }

  // 4. Return fast 200 ACCEPTED response to carrier
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'ACCEPTED',
      requestId,
      returnNumber: payload.returnNumber,
      event: payload.event,
    }),
  };
};
