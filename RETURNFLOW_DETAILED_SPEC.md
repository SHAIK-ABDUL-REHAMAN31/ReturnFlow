# ReturnFlow — Detailed Implementation Specification

> **How to use this document:** This is the file-by-file build spec, not the folder-structure overview. For every file that matters, it states: what it's responsible for, what data enters and leaves it, exactly how errors are handled at that point, and the security rule that applies there. Code blocks show the actual pattern to follow — not decoration, the real shape of the function.

---

## 0. Global Conventions (apply to every file below)

**Naming:** `kebab-case` for filenames, `PascalCase` for classes/types/React components, `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants and env var names.

**Every backend file that touches the network or the database follows this shape, no exceptions:**
```text
Controller   → parses HTTP, has ZERO business logic, calls one service method, returns response
Service      → business logic only, no req/res objects, no direct DB/SDK calls
Repository   → the only place that talks to MongoDB
AWS client   → the only place that talks to a given AWS SDK client
Schema       → the only place validation rules live for that module
```
No file skips a layer. A controller never calls a repository directly. A service never imports `express`.

**Every function that can fail returns or throws a typed error**, never a raw string or an untyped `Error`. See §5 (Error Handling Standard) before writing any file.

**Every file that accepts external input (HTTP body, SQS message body, S3 event, webhook payload) validates that input at the top of the file, before any other logic runs.** This is the single most important rule in this document — it is restated per-file below so it's never skipped.

---

## 1. Data Flow Maps

These are the flows every file below plugs into. Read this section first so the per-file spec makes sense in context.

### 1.1 Return Creation (Customer-facing)
```text
Frontend: returns/new form
   │  validated client-side (zod, UX only — not trusted)
   ▼
POST /api/returns          [returns.routes.ts]
   │  validate.middleware.ts → returns.schema.ts (createReturnSchema)
   │  auth.middleware.ts → confirms JWT, attaches req.user
   ▼
returns.controller.ts → createReturn(req, res)
   │  extracts validated body + req.user only, no raw req access below this line
   ▼
returns.service.ts → createReturnRequest(dto, userId)
   │  1. checks eligibility (cache.service.ts → Redis GET eligibility:{sku})
   │  2. if photo present: s3-client.ts → generates presigned PUT URL, does NOT store file itself
   │  3. returns.repository.ts → insert document, status = PENDING_REVIEW
   ▼
MongoDB: returns collection
   │
   ▼
Response: { returnId, status, uploadUrl }
   │
Frontend: PUTs photo directly to S3 using uploadUrl (file never passes through the backend)
```

### 1.2 Merchant Approval → Label Generation (async)
```text
Frontend: click "Approve"           [ReturnDetail.tsx]
   ▼
PATCH /api/returns/:id/approve      [returns.routes.ts]
   │  auth.middleware.ts → confirms role === MERCHANT/ADMIN
   ▼
returns.controller.ts → approveReturn(req, res)
   ▼
returns.service.ts → approveReturn(returnId, merchantId)
   │  1. returns.state-machine.ts → validate transition PENDING_REVIEW → APPROVED (throws if illegal)
   │  2. returns.repository.ts → persist new status
   │  3. sqs-client.ts → send message { returnId, action: "GENERATE_LABEL" } to label queue
   ▼
Response returned immediately: { status: "APPROVED", labelStatus: "processing" }
      (the label PDF is NOT generated in this request — see 1.3)
```

### 1.3 Label Worker (background, decoupled from the HTTP request)
```text
SQS: label-generation-queue
   ▼
label-worker.ts (long-running process, separate ECS task or same task's worker loop)
   │  1. validate message shape (labelJobSchema) — SQS messages are external input too
   │  2. returns.repository.ts → fetch return by id, confirm status is still APPROVED
   │     (defends against stale/duplicate messages — see idempotency note in §4.5)
   │  3. generate PDF (pdf-lib, in-memory, no temp files on disk)
   │  4. s3-client.ts → putObject(label PDF), private ACL
   │  5. returns.repository.ts → update status → LABEL_GENERATED, store labelUrl (S3 key, not public URL)
   │  6. sns-client.ts → publish "label ready" notification
   │  7. delete SQS message ONLY after all above steps succeed (at-least-once processing)
```

### 1.4 Refund Processing
```text
Frontend: merchant clicks "Mark Received"
   ▼
PATCH /api/returns/:id/receive
   ▼
returns.service.ts → markReceived(returnId)
   │  1. state-machine: IN_TRANSIT → RECEIVED
   │  2. dynamo-client.ts → conditional write of idempotency key returnId:refund
   │     (if key already exists → short-circuit, return existing result, do NOT double-refund)
   │  3. sqs-client.ts → send refund job
   ▼
refund-worker.ts
   │  1. validate message
   │  2. process refund logic
   │  3. repository → status → REFUNDED
   │  4. sns-client.ts → notify customer + merchant
```

### 1.5 Search
```text
Frontend: search box, debounced input
   ▼
GET /api/search/returns?q=...
   ▼
search.controller.ts → search.service.ts → opensearch-client.ts
   │  query is built with a fixed query template (multi_match on allow-listed fields only)
   │  user input is NEVER interpolated into a raw query string
   ▼
Response: paginated results, max 50 per page, hard server-side cap regardless of client-requested size
```

### 1.6 Step Functions — Label Sub-flow (Phase 4 enhancement)
```text
returns.service.ts → approveReturn()
   │  instead of a raw SQS send, starts a Step Functions execution
   ▼
stepfunctions-client.ts → startExecution(labelGenerationStateMachineArn, { returnId })
   ▼
States: ValidateReturn → GenerateLabel(Lambda) → UploadToS3(Lambda) → UpdateStatus(Lambda) → Notify(SNS) → Success
   │  each state has a Catch block → on failure, transitions to a FailureNotification state
   │  instead of failing silently
```

---

## 2. Error Handling Standard

Defined once, used everywhere. Create this first — every other file imports from it.

**`backend/src/lib/app-error.ts`**
```typescript
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,       // machine-readable, e.g. "RETURN_NOT_FOUND"
    message: string,                     // human-readable, safe to show to the client
    public readonly isOperational = true // false = programmer error, never expose details
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Pre-defined errors used across modules — do not throw ad-hoc `new Error(...)` in services.
export const Errors = {
  notFound: (resource: string) =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),
  invalidTransition: (from: string, to: string) =>
    new AppError(409, 'INVALID_STATE_TRANSITION', `Cannot move from ${from} to ${to}`),
  unauthorized: () =>
    new AppError(401, 'UNAUTHORIZED', 'Authentication required'),
  forbidden: () =>
    new AppError(403, 'FORBIDDEN', 'You do not have access to this resource'),
  validation: (details: string) =>
    new AppError(400, 'VALIDATION_ERROR', details),
  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),
};
```

**`backend/src/middleware/error.middleware.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ code: err.code, path: req.path }, err.message);
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }

  // Unknown / programmer error: log full detail internally, NEVER leak stack/message to client.
  logger.error({ path: req.path, err }, 'Unhandled error');
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
```
**Rule:** this is the *only* place a response body containing an error is constructed. No controller ever writes its own `catch { res.status(500)... }` block — controllers wrap their call in `try { } catch (err) { next(err); }` and let this middleware decide the response. This guarantees stack traces and internal details never leak to the client, and every error is logged exactly once, in one format.

---

## 3. Frontend — File-by-File

### `frontend/src/lib/api-client.ts`
**Responsibility:** the *only* file allowed to call `fetch()` against the backend.
**Data in:** method, path, optional body/query.
**Data out:** typed response or a thrown `ApiClientError`.
**Rules:**
- Attaches the JWT from memory (never from `localStorage` for the access token — see §6.2) via `Authorization` header.
- On a `401`, triggers a single refresh-token attempt, then retries once; on a second `401`, logs the user out client-side.
- Never swallows errors — every non-2xx response throws, so callers must handle it explicitly.
```typescript
export async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${getAccessToken()}`, 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (res.status === 401) { /* refresh-and-retry logic, one attempt only */ }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? 'Request failed');
  }
  return res.json();
}
```

### `frontend/src/lib/validators/return.schema.ts`
**Responsibility:** the same shape of validation as the backend's `returns.schema.ts`, duplicated intentionally (client-side copy is UX-only, never trusted as the security boundary). Written in zod so types are inferred, not hand-written twice.

### `frontend/src/features/returns/returnsSlice.ts`
**Responsibility:** Redux Toolkit slice — state shape, async thunks calling `api-client.ts`, no direct `fetch` calls here.
**Data flow:** thunk dispatched → `pending` → `api-client.ts` call → `fulfilled`/`rejected` → component re-renders from store state, never from local component state for server data.
**Rule:** thunks never catch-and-swallow; rejected actions carry the `ApiClientError` payload so the UI can show the real error code, not a generic "something went wrong."

### `frontend/src/app/returns/[returnId]/page.tsx`
**Responsibility:** server component that fetches initial data; delegates all mutation (approve/reject/receive) to a client component.
**Data in:** `returnId` from the route param — validated as a Mongo ObjectId shape before use, invalid format renders a 404, not a raw thrown error.
**Rule:** no business logic here — this file's only job is composing components and passing typed props down.

### `frontend/src/components/returns/ApproveButton.tsx`
**Responsibility:** single-purpose component, one action.
**Rule:** disables itself immediately on click (prevents double-submit / double-refund at the UI layer, in addition to the backend's idempotency key), shows a loading and an explicit error state — never a silent failure.

### `frontend/src/components/ui/*`
Generic, presentation-only components (Button, Card, Badge, Modal). **No data fetching, no business logic, no direct store access** — props in, JSX out. This boundary is what keeps the codebase testable without mocking Redux everywhere.

---

## 4. Backend — File-by-File

### 4.1 `backend/src/config/env.ts`
**Responsibility:** the single source of truth for configuration; nothing else in the codebase reads `process.env` directly.
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REDIS_URL: z.string().min(1),
  AWS_REGION: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  SQS_LABEL_QUEUE_URL: z.string().url(),
  SQS_REFUND_QUEUE_URL: z.string().url(),
  SNS_TOPIC_ARN: z.string().min(1),
  OPENSEARCH_ENDPOINT: z.string().url(),
});

// Fails the process immediately on boot if anything is missing/malformed —
// never starts the server with a guessed or empty default for a secret.
export const env = envSchema.parse(process.env);
```

### 4.2 `backend/src/config/aws.ts`
**Responsibility:** constructs AWS SDK v3 clients once, exports singletons. **No credentials are ever set here** — the SDK picks them up from the ECS task's IAM role automatically (or a local named profile in dev). Hardcoding `accessKeyId`/`secretAccessKey` in this file is a direct violation of §6.

### 4.3 `backend/src/modules/auth/`
| File | Responsibility | Data in → out |
|---|---|---|
| `auth.schema.ts` | zod schemas: `registerSchema`, `loginSchema` — password min length/complexity enforced here | raw body → typed, validated DTO |
| `auth.routes.ts` | wires `POST /register`, `POST /login`, `POST /refresh` to controller; `rate-limit.middleware.ts` applied specifically here, tighter limits than the rest of the API | — |
| `auth.controller.ts` | parses `req.body` (already validated by middleware), calls service, sets refresh token as an `httpOnly`, `Secure`, `SameSite=strict` cookie — **never** returned in the JSON body | DTO → HTTP response |
| `auth.service.ts` | hashes password (bcrypt, cost 12), checks credentials with a constant-time comparison (bcrypt.compare handles this), issues JWT pair | DTO → `{ accessToken, refreshToken, user }` |
| `auth.middleware.ts` | verifies JWT signature + expiry, attaches `req.user = { id, role }`; throws `Errors.unauthorized()` on any failure — never partially trusts a malformed token | raw header → `req.user` or throw |
| `auth.test.ts` | covers: wrong password, expired token, tampered token, missing role, rate-limit trip | — |

### 4.4 `backend/src/modules/returns/`
| File | Responsibility |
|---|---|
| `returns.schema.ts` | `createReturnSchema`, `approveReturnSchema` (empty body, action is in the route+role), enums for `reason` are a fixed allow-list, not free text, to keep OpenSearch aggregations meaningful |
| `returns.routes.ts` | `POST /`, `GET /:id`, `PATCH /:id/approve`, `PATCH /:id/reject`, `PATCH /:id/receive` — every mutating route has `auth.middleware.ts` + `validate.middleware.ts` chained before the controller, in that order |
| `returns.controller.ts` | thin — extract `req.user`/validated body/params, call one service method, `res.status(...).json(...)`, wrap in try/catch → `next(err)` |
| `returns.state-machine.ts` | pure function, no I/O — `assertValidTransition(current, next)`; throws `Errors.invalidTransition` if the edge isn't in the allowed transition map. Table-driven, not a chain of `if` statements, so it's trivial to audit and to screenshot for the interview |
| `returns.service.ts` | orchestrates: state-machine check → repository write → downstream side-effect (SQS/Step Functions/cache invalidation). Owns the transaction boundary — if the DB write succeeds but the SQS send fails, logs a warning and lets a periodic reconciliation job catch it, rather than silently losing the message |
| `returns.repository.ts` | only file with `mongoose`/`mongodb` driver calls for this module; every query is built with the driver's query builder, never a template string containing user input |
| `returns.test.ts` | unit tests for the state machine (every legal and illegal transition), integration tests for the controller→service→repository chain against an in-memory Mongo instance |

```typescript
// returns.state-machine.ts — table-driven, exhaustive, no fallthrough
const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  PENDING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['LABEL_GENERATED'],
  LABEL_GENERATED: ['IN_TRANSIT'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: ['REFUNDED'],
  REJECTED: [],
  REFUNDED: [],
};

export function assertValidTransition(current: ReturnStatus, next: ReturnStatus): void {
  if (!TRANSITIONS[current]?.includes(next)) {
    throw Errors.invalidTransition(current, next);
  }
}
```

### 4.5 `backend/src/workers/label-worker.ts`
**Responsibility:** long-running SQS consumer loop.
**Data flow:** poll SQS → validate message shape → look up return → idempotency check → do the work → delete message.
```typescript
async function handleMessage(raw: SQSMessage) {
  const parsed = labelJobSchema.safeParse(JSON.parse(raw.Body ?? '{}'));
  if (!parsed.success) {
    logger.error({ raw }, 'Malformed label job message — sent to DLQ, not retried indefinitely');
    return; // let SQS redrive policy move it to the dead-letter queue after N receives
  }
  const { returnId } = parsed.data;

  const existing = await returnsRepository.findById(returnId);
  if (!existing) return; // return was deleted/invalid — drop silently, log a warning
  if (existing.status !== 'APPROVED') return; // already processed by a previous, duplicate delivery — idempotent no-op

  const pdfBuffer = await generateLabelPdf(existing);
  const key = await s3Client.putLabel(returnId, pdfBuffer);
  await returnsRepository.updateStatus(returnId, 'LABEL_GENERATED', { labelKey: key });
  await snsClient.publish('label.ready', { returnId });
}
```
**Rule:** SQS gives *at-least-once* delivery — every worker file must be written so processing the same message twice is safe (checked above via the status guard). This is stated explicitly because it is the most common source of "duplicate refund" bugs in this kind of system, and is exactly the kind of thing an interviewer will ask about.

### 4.6 `backend/src/lib/s3-client.ts`
**Responsibility:** only file that constructs S3 requests.
**Rules:** bucket is never public; every read is a presigned GET URL with a short expiry (e.g., 5 minutes); every upload is either a presigned PUT (customer photo, direct-to-S3) or a server-side `PutObjectCommand` (generated label), never a public-write bucket policy. Object keys are namespaced by return ID and never derived from unsanitized user input (e.g., not `req.body.filename` used directly as the key).

### 4.7 `backend/src/lib/cache.service.ts` (Redis)
**Responsibility:** eligibility cache + abuse counters. **Rule:** Redis is a cache, never the system of record — every read path has a DB fallback on a cache miss, and TTLs are always set explicitly (no unbounded keys). Abuse counters use `INCR` + `EXPIRE` atomically (via a Lua script or `MULTI`) to avoid a race where two concurrent requests both read a stale count.

### 4.8 `backend/src/modules/search/opensearch-client.ts`
**Rule:** the query body is a fixed template with the user's search term passed as a *value*, never string-concatenated into the query DSL. Only an explicit allow-list of fields (`customerName`, `sku`, `status`, `reason`) is searchable — this prevents both injection and accidental exposure of internal fields.

### 4.9 `backend/src/middleware/rate-limit.middleware.ts`
**Rule:** backed by Redis (not in-memory) so limits hold correctly across multiple ECS tasks. Auth routes get a stricter limit than general API routes.

### 4.10 `backend/src/middleware/validate.middleware.ts`
```typescript
export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(Errors.validation(result.error.issues.map(i => i.message).join(', ')));
  }
  req.body = result.data; // replace with the parsed, coerced, trusted version
  next();
};
```
**Rule:** downstream code (controller, service) reads `req.body` **after** this middleware and treats it as trusted — this is the one and only place raw input becomes trusted input.

### 4.11 `backend/src/app.ts`
**Responsibility:** wires middleware order, which matters:
```text
helmet() → cors() → express.json({ limit: '1mb' }) → rate-limit (global) → routes → errorMiddleware (last, always)
```
**Rule:** `errorMiddleware` is registered after every route, and is the last `app.use()` call in the file — Express only treats a 4-argument function as error middleware if it's registered last.

---

## 5. Infra Files

### `infra/step-functions/label-generation.asl.json`
Each state has an explicit `Catch` — no state is allowed to fail without a defined next step:
```json
{
  "StartAt": "ValidateReturn",
  "States": {
    "ValidateReturn": { "Type": "Task", "Resource": "arn:...:validateReturn", "Next": "GenerateLabel",
      "Catch": [{ "ErrorEquals": ["States.ALL"], "Next": "NotifyFailure" }] },
    "GenerateLabel": { "Type": "Task", "Resource": "arn:...:generateLabel", "Next": "UploadToS3",
      "Catch": [{ "ErrorEquals": ["States.ALL"], "Next": "NotifyFailure" }] },
    "UploadToS3": { "Type": "Task", "Resource": "arn:...:uploadLabel", "Next": "UpdateStatus",
      "Catch": [{ "ErrorEquals": ["States.ALL"], "Next": "NotifyFailure" }] },
    "UpdateStatus": { "Type": "Task", "Resource": "arn:...:updateStatus", "Next": "Notify" },
    "Notify": { "Type": "Task", "Resource": "arn:...:snsPublish", "End": true },
    "NotifyFailure": { "Type": "Task", "Resource": "arn:...:snsPublishFailure", "End": true }
  }
}
```

### `infra/terraform/modules/iam/`
**Rule:** one policy document per role, each listing specific `Action`s and specific `Resource` ARNs — no `"Action": "*"`, no `"Resource": "*"`. Example shape (not full policy): the ECS task role gets `s3:GetObject`/`s3:PutObject` scoped to `arn:aws:s3:::returnflow-bucket/*` only, `sqs:SendMessage`/`ReceiveMessage` scoped to the two named queue ARNs only, and `logs:CreateLogStream`/`PutLogEvents` scoped to its own log group ARN.

---

## 6. Security Rules Recap, Mapped to Files

| Risk | File(s) that mitigate it |
|---|---|
| Secrets in source control | `env.ts`, `.env.example`, `.gitignore`, `.dockerignore` |
| Injection (NoSQL/query) | `returns.repository.ts`, `opensearch-client.ts` — driver query builders / fixed templates only |
| Broken auth | `auth.middleware.ts`, `auth.service.ts` — server-verified role on every mutating route |
| Double-processing / duplicate refunds | `label-worker.ts`, `refund-worker.ts`, DynamoDB idempotency key check in `returns.service.ts` |
| Public data exposure | `s3-client.ts` (presigned URLs only), IAM policies (no `*`) |
| XSS | frontend components — no `dangerouslySetInnerHTML`; `helmet` CSP in `app.ts` |
| Stack trace / internal leak | `error.middleware.ts` — single controlled response shape |
| Vulnerable dependencies | `security-scan.yml` (Trivy + `npm audit` + CodeQL), Dependabot config |
| Over-privileged infra | `infra/terraform/modules/iam/` — scoped policies per role |
| Rate/brute-force abuse | `rate-limit.middleware.ts`, applied tightest on `auth.routes.ts` |

---

## 7. Testing Requirement Per Layer

- **Schema files:** test both a valid payload and every rejection case (missing field, wrong type, out-of-range enum).
- **State machine:** test every legal transition and at least one illegal transition per state (exhaustive, not sampled).
- **Services:** unit tests with repository/AWS clients mocked — verify the *sequence* of calls (e.g., "SQS send only happens after the repository write succeeds").
- **Workers:** test the idempotency guard explicitly — feed the same message twice, assert the side effect (S3 put, refund) only happens once.
- **Controllers:** integration test through the real Express app + an in-memory Mongo, asserting HTTP status and response shape, not internals.

No file is considered done until its corresponding `*.test.ts` covers at least the failure paths listed above — the happy path alone does not meet the bar for this project.
