# ReturnFlow — 8-Step Technical Interview Walkthrough Script

> **Purpose:** Rehearsal and execution guide for live interview demonstrations.  
> **Demonstrates:** Deterministic State Machine, AWS Step Functions, S3 Signed URLs, SQS Workers, SNS Pub/Sub, Redis Rate Limiting, OpenSearch Queries, Timing-Safe HMAC Webhooks, and CloudWatch EMF Observability.

---

## Step 1: Merchant Authentication & In-Memory JWT Security (§5.3)
1. **Navigate:** Open `http://localhost:3000` (or production CloudFront/ALB URL).
2. **Observe:** The browser automatically redirects to the `/login` authentication screen.
3. **One-Click Demo Login:** Click **"Fill Demo Credentials (Merchant)"** to populate:
   - Email: `merchant@returnflow.io`
   - Password: `Password123!`
4. **Click Sign In:**
   - Open browser DevTools $\to$ Application $\to$ LocalStorage $\to$ Verify that **no access tokens are stored in LocalStorage** (blunts XSS token theft).
   - In-memory Redux store holds the short-lived access token; httpOnly secure cookie holds the refresh token.

---

## Step 2: Merchant Overview, Real-Time Metrics & Demo Control Bar
1. **Navigate:** Land on `/dashboard`.
2. **Live KPI Cards:**
   - **Needs Review:** Returns awaiting merchant approval (`PENDING_REVIEW`).
   - **Active In Transit:** Returns en route with carriers (`IN_TRANSIT`).
   - **Warehouse Received:** Delivered packages ready for inspection (`RECEIVED`).
   - **Total Refunded:** Total dollar volume processed.
3. **Visual State Machine Pipeline:** Observe live count badges distributed across each status phase.
4. **Interactive Demo Bar:** Highlight the floating toolbar at the bottom of the screen with quick actions:
   - **"Carrier Pickup (Simulate Scan)"**: Dispatches HMAC-signed webhook.
   - **"Dock Delivery"**: Simulates carrier drop-off at warehouse.
   - **"Simulate 409 Attack"**: Demonstrates security boundary defense.
   - **"Reset Demo Data"**: Calls `/api/demo/seed` to restore predictable state.

---

## Step 3: Customer Self-Service Portal & 30-Day Order Eligibility (§1.1)
1. **Navigate:** Open the customer returns portal at `/returns/new` (or click "Customer Returns Portal" in navbar).
2. **Lookup Order:**
   - Order Number: `ORD-9021`
   - Customer Email: `customer@example.com`
3. **Click Check Return Eligibility:**
   - Instant response evaluated against purchase date: order was delivered within 30 days.
   - Cached in Redis to prevent repeated database query storms.
4. **Item Selection & Return Reason:**
   - Select the purchased item checkbox.
   - Select reason category: `DEFECTIVE` (or `WRONG_ITEM`, `SIZE_TOO_SMALL`).
   - Enter customer note: *"Zipper caught and damaged on first use."*
5. **Click Submit Return Request:**
   - Generates tracking return ID (e.g., `RET-80101`).

---

## Step 4: Direct-to-S3 Photo Evidence Upload via Presigned URL (§1.1)
1. **Evidence Photo Section:**
   - Right on the return confirmation card (or inside `/returns/[returnId]`), locate the **"Attach Proof / Condition Photo"** component.
2. **Select Image:** Choose a sample photo (JPG/PNG < 5MB).
3. **Click "Send to S3":**
   - Step 1: Frontend calls `POST /api/returns/:id/upload-url` $\to$ Backend returns a 15-minute presigned `PUT` URL.
   - Step 2: Frontend directly sends an HTTP `PUT` from browser to Amazon S3.
   - **Key Interview Talking Point:** Files never transit through or store on the backend Node.js container, saving container memory and eliminating double-bandwidth transfer costs.

---

## Step 5: Merchant Review, Approval & Step Functions / SQS Orchestration (§1.2 & §1.6)
1. **Navigate:** Go to `/returns` (Merchant Queue) and open the new return.
2. **Audit Timeline:** Point out the initial `PENDING_REVIEW` entry with timestamp.
3. **Visualizers:** Show both the **Lifecycle State Machine Visualizer** and the **Step Functions Sub-flow Visualizer** (`ValidateReturn` $\to$ `GenerateLabel` $\to$ `UploadToS3` $\to$ `UpdateStatus` $\to$ `Notify`).
4. **Click "Approve Return":**
   - Optimistic double-click defense prevents duplicate submission.
   - Status updates atomically to `APPROVED` then `LABEL_GENERATED`.
   - SQS background worker (`label-worker.js`) renders in-memory PDF and uploads to private S3 bucket.
   - Step Functions client (`stepfunctions-client.js`) logs execution ARN.
   - SNS publishes `return.approved` event.

---

## Step 6: Secure Presigned PDF Shipping Label Download (§1.3)
1. **Label Generation Confirmation:** Notice the shipping label object key generated under `labels/`.
2. **Click "Download Shipping Label (PDF)":**
   - Calls `GET /api/returns/:id/label-url`.
   - Backend generates a 5-minute time-limited presigned `GET` URL.
   - Browser opens the generated shipping label PDF with QR/barcode and return address.
   - **Key Interview Talking Point:** S3 bucket has zero public read ACLs; access is strictly gated by short-lived IAM-signed URLs.

---

## Step 7: Carrier Webhook Simulation & Timing-Safe HMAC Verification (§2 Phase 4)
1. **Simulate Carrier Pickup:**
   - Click **"Carrier Pickup"** in the Demo Bar (or send HTTP request to `/api/webhooks/carrier`).
   - The request calculates `x-carrier-signature` using HMAC SHA-256 and the shared webhook secret.
2. **Backend Processing:**
   - Express preserves raw wire bytes (`req.rawBody`) before schema transformation.
   - Controller verifies signature using `crypto.timingSafeEqual` (blunts timing attacks).
   - Return status advances deterministically from `LABEL_GENERATED` $\to$ `IN_TRANSIT`.
3. **Simulate Dock Delivery:**
   - Click **"Dock Delivery"** in the Demo Bar.
   - Status advances from `IN_TRANSIT` $\to$ `RECEIVED`.
   - Timeline appends audit entry: *"Delivered to warehouse dock by UPS. Ready for physical inspection."*

---

## Step 8: Warehouse Receipt, Automated Refund & State Machine 409 Attack Defense (§4.4)
1. **Final Refund:**
   - Click **"Issue Refund"** in the top action bar.
   - Asynchronous refund worker verifies idempotency key in Redis, invokes refund logic, updates status to `REFUNDED` (terminal state), and broadcasts via SNS.
2. **State Machine 409 Security Boundary Demonstration:**
   - Click **"Simulate 409 Attack"** on the Demo Bar (attempts illegal jump from `REFUNDED` $\to$ `APPROVED` or `PENDING_REVIEW` $\to$ `REFUNDED`).
   - Observe immediate modal showing `409 INVALID_STATE_TRANSITION` error.
   - **Key Interview Talking Point:** Business integrity is enforced strictly in code via `assertValidTransition` rather than loose UI checks. Even if an attacker bypasses the frontend, the state machine halts unauthorized mutations.
3. **CloudWatch Observability:**
   - Show `infra/cloudwatch/dashboards.json` and CloudWatch EMF logs demonstrating structured, sanitized logging with zero PII or credentials leaked.
