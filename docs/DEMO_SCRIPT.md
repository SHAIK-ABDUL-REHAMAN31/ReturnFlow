# ReturnFlow — Live Demonstration Script

This script walks through the end-to-end functionality of ReturnFlow for interview demonstrations.

---

## Step 1: Merchant Authentication
1. Open the application: `http://localhost:3000` (or production CloudFront/ALB URL).
2. The user is redirected to the **Merchant Console Login**.
3. Click **"Fill Demo Credentials (Merchant)"** to populate:
   - Email: `merchant@returnflow.io`
   - Password: `Password123!`
4. Click **Sign In**.
5. Observe JWT issued in-memory and secure httpOnly refresh cookie established.

---

## Step 2: Merchant Overview & Real-Time Metrics
1. Navigate to `/dashboard`.
2. Review the live KPI cards:
   - **Needs Review:** Returns in `PENDING_REVIEW`.
   - **Active In Transit:** Orders with generated labels and carrier transit.
   - **Warehouse Received:** Packages delivered to warehouse dock awaiting final inspection.
   - **Total Refunded:** Financial refund tally.
3. Review the visual state machine pipeline track displaying live counts per status.

---

## Step 3: Customer Self-Service Return Request
1. Open the Customer Portal in an incognito window or via top-nav: `http://localhost:3000/returns/new`.
2. Lookup order:
   - Order Number: `ORD-9021`
   - Customer Email: `customer@example.com`
3. Click **Check Return Eligibility**.
4. Observe instantaneous eligibility resolution (delivered < 30 days ago, SKUs validated against DB & Redis cache).
5. Select items to return, choose a reason (e.g. `DEFECTIVE`), and add an optional statement.
6. Click **Submit Return Request**.
7. Receive generated Return Tracking ID (e.g., `RET-80101`).

---

## Step 4: Merchant Approval & Label Generation
1. Return to the Merchant Console `/returns`.
2. Locate the newly created return in `PENDING_REVIEW`. Click **Manage**.
3. Review customer items, reasons, and timeline audit entries.
4. Click **Approve Return**:
   - Status updates deterministically to `APPROVED`.
   - Double-click protection prevents repeated submissions.
   - Background SQS worker is dispatched to generate shipping label PDF and upload to private S3 bucket.

---

## Step 5: Warehouse Receipt & Automated Refund
1. When the package arrives at fulfillment, click **Mark Items Received**.
2. State advances to `RECEIVED`.
3. Background refund worker processes electronic refund via idempotent key.
4. Click **Issue Refund** to finalize.
5. The state machine transitions to `REFUNDED` (terminal state).

---

## Step 6: Verifying Architectural Guardrails
1. Attempt an illegal state transition (e.g. jumping directly from `PENDING_REVIEW` to `REFUNDED`).
2. Show that the backend state machine throws `409 INVALID_STATE_TRANSITION` and halts the action.
3. Review CloudWatch structured JSON logs demonstrating sanitization of all sensitive tokens.
