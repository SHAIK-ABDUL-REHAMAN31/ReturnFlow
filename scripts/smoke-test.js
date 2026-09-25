/**
 * ReturnFlow Automated System Smoke Test (§5 Phase 5)
 * Pure JavaScript (ESM) validation script.
 * Zero external dependencies: Uses built-in Node.js crypto and fetch.
 *
 * Runs end-to-end against either a live URL (API_URL=http://localhost:4000)
 * or spins up an ephemeral backend app instance for CI verification.
 */

import http from 'http';
import crypto from 'crypto';

const API_BASE = process.env.API_URL || null;
const WEBHOOK_SECRET = process.env.CARRIER_WEBHOOK_SECRET || 'rf_carrier_shared_secret_secure_key_2026';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'local_dev_access_secret_min_32_characters_long_12345';

let server = null;
let baseUrl = API_BASE;

function logStep(stepNum, description) {
  console.log(`\n\x1b[36m[STEP ${stepNum}]\x1b[0m \x1b[1m${description}\x1b[0m`);
}

function logPass(message) {
  console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
}

function logFail(message, details = null) {
  console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
  if (details) console.error(details);
  process.exit(1);
}

// Built-in JWT HS256 generator using Node.js crypto (zero external dependency)
function createSignedJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(payload)}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

async function startServerIfNeeded() {
  if (baseUrl) {
    console.log(`\x1b[34mRunning smoke tests against live target:\x1b[0m ${baseUrl}`);
    return;
  }

  console.log('\x1b[34mNo API_URL provided, booting ephemeral backend app instance...\x1b[0m');
  const { app } = await import('../backend/src/app.js');

  return new Promise((resolve, reject) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      console.log(`\x1b[32mEphemeral backend server running at:\x1b[0m ${baseUrl}`);
      resolve();
    });
    server.on('error', reject);
  });
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

async function runSmokeTests() {
  console.log('===============================================================');
  console.log('   ReturnFlow E2E Reverse Logistics System Smoke Test (§5)    ');
  console.log('===============================================================');

  await startServerIfNeeded();

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Healthcheck & Security Headers (§5.4 & §6)
    // -------------------------------------------------------------------------
    logStep(1, 'Verifying Healthcheck & Security Headers');
    const health = await request('/health');
    if (health.status !== 200 || health.data.status !== 'healthy') {
      logFail(`Expected 200 healthy, got ${health.status}`, health.data);
    }
    if (health.headers.get('x-content-type-options') !== 'nosniff') {
      logFail('Missing nosniff header from Helmet');
    }
    logPass('Healthcheck OK, status="healthy", security headers verified.');

    // -------------------------------------------------------------------------
    // STEP 2: Centralized 404 & Central Error Boundary (§4.11)
    // -------------------------------------------------------------------------
    logStep(2, 'Testing Central Error Boundary & 404 Route');
    const notFound = await request('/api/non-existent-route-smoke');
    if (notFound.status !== 404 || notFound.data?.error?.code !== 'ROUTE_NOT_FOUND') {
      logFail('Route 404 did not produce expected structured JSON', notFound.data);
    }
    logPass('Central error boundary handles undefined routes cleanly (ROUTE_NOT_FOUND).');

    // -------------------------------------------------------------------------
    // STEP 3: Zod Validation Boundary (§5.2)
    // -------------------------------------------------------------------------
    logStep(3, 'Validating Zod Input Guardrails (Reject Malformed Payloads)');
    const badReg = await request('/api/auth/register', {
      method: 'POST',
      body: { email: 'bad-email-format', password: 'short' },
    });
    if (badReg.status !== 400 || badReg.data?.error?.code !== 'VALIDATION_ERROR') {
      logFail('Failed to reject invalid registration payload with 400 VALIDATION_ERROR', badReg.data);
    }
    logPass('Input guardrail rejected invalid email & short password with 400 VALIDATION_ERROR.');

    // -------------------------------------------------------------------------
    // STEP 4: Carrier Webhook HMAC Timing-Safe Signature Security (§2 Phase 4)
    // -------------------------------------------------------------------------
    logStep(4, 'Verifying Carrier Webhook HMAC SHA-256 Signature Security');
    const unsignedWebhook = await request('/api/webhooks/carrier', {
      method: 'POST',
      body: {
        event: 'CARRIER_PICKUP',
        trackingNumber: 'TRK-SMOKE-100',
        returnNumber: 'RET-SMOKE-999',
      },
    });
    if (unsignedWebhook.status !== 401) {
      logFail(`Expected 401 UNAUTHORIZED on unsigned webhook, got ${unsignedWebhook.status}`);
    }
    logPass('Unsigned carrier webhook rejected with 401 UNAUTHORIZED.');

    const forgedWebhook = await request('/api/webhooks/carrier', {
      method: 'POST',
      headers: {
        'x-carrier-signature': 'forged_fake_signature_hex_1234567890abcdef',
      },
      body: {
        event: 'CARRIER_PICKUP',
        trackingNumber: 'TRK-SMOKE-100',
        returnNumber: 'RET-SMOKE-999',
      },
    });
    if (forgedWebhook.status !== 401) {
      logFail(`Expected 401 on forged signature, got ${forgedWebhook.status}`);
    }
    logPass('Forged webhook signature rejected with 401 UNAUTHORIZED.');

    // -------------------------------------------------------------------------
    // STEP 5: Global Rate Limiting Headers (§5.3)
    // -------------------------------------------------------------------------
    logStep(5, 'Validating Global Rate Limiter & Abuse Counters');
    const rlCheck = await request('/health');
    if (!rlCheck.headers.get('x-ratelimit-limit') || !rlCheck.headers.get('x-ratelimit-remaining')) {
      logFail('Missing X-RateLimit-* headers on response');
    }
    logPass(
      `Rate limit headers active (Limit: ${rlCheck.headers.get('x-ratelimit-limit')}, Remaining: ${rlCheck.headers.get('x-ratelimit-remaining')}).`
    );

    // -------------------------------------------------------------------------
    // STEP 6: RBAC Authorization & Guardrails (§5.3)
    // -------------------------------------------------------------------------
    logStep(6, 'Testing RBAC Route Guardrails (authMiddleware & requireRole)');
    const unauthSearch = await request('/api/search/returns?q=RET');
    if (unauthSearch.status !== 401) {
      logFail(`Expected 401 on unauthenticated search access, got ${unauthSearch.status}`);
    }
    logPass('Unauthenticated search request rejected with 401 UNAUTHORIZED.');

    // Create valid merchant token using built-in crypto
    const exp = Math.floor(Date.now() / 1000) + 900;
    const merchantToken = createSignedJwt(
      { sub: 'usr_smoke_merchant', email: 'merchant@smoke.test', role: 'MERCHANT', exp },
      JWT_SECRET
    );
    const authHeaders = { Authorization: `Bearer ${merchantToken}` };

    const unauthAnalytics = await request('/api/analytics');
    if (unauthAnalytics.status !== 401) {
      logFail(`Expected 401 on unauthenticated analytics access, got ${unauthAnalytics.status}`);
    }
    logPass('Unauthenticated analytics request rejected with 401 UNAUTHORIZED.');

    // -------------------------------------------------------------------------
    // STEP 7: Authenticated Search Endpoint (§1.5)
    // -------------------------------------------------------------------------
    logStep(7, 'Testing Authenticated Search Route');
    const authSearch = await request('/api/search/returns?q=RET', { headers: authHeaders });
    if (authSearch.status === 401 || authSearch.status === 403) {
      logFail(`Merchant token rejected by search endpoint: ${authSearch.status}`);
    }
    logPass('Authenticated merchant search request authorized successfully.');

    // -------------------------------------------------------------------------
    // STEP 8: Authenticated Analytics Endpoint (§2 Phase 5)
    // -------------------------------------------------------------------------
    logStep(8, 'Testing Authenticated Analytics Route');
    const authAnalytics = await request('/api/analytics', { headers: authHeaders });
    if (authAnalytics.status === 401 || authAnalytics.status === 403) {
      logFail(`Merchant token rejected by analytics endpoint: ${authAnalytics.status}`);
    }
    logPass('Authenticated merchant analytics request authorized successfully.');

    console.log('\n===============================================================');
    console.log('   \x1b[32m✔ ALL 8 SYSTEM SMOKE CHECKS PASSED CLEANLY (0 ERRORS)\x1b[0m   ');
    console.log('===============================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runSmokeTests().catch((err) => {
  console.error('\n\x1b[31mFATAL SMOKE TEST FAILURE:\x1b[0m', err);
  if (server) server.close();
  process.exit(1);
});
