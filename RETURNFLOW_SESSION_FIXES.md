# ReturnFlow: Session Notes on Fixes and the Customer Tracking Flow

This document records the problems found while testing the return flow, the cause of each, and the fix. It also defines how customers access their return without an account.

## Summary of Issues

| # | Problem | Cause | Fix |
|---|---|---|---|
| 1 | The same item on the same order can be submitted for return many times | The eligibility check only reads the order and never looks for an existing return | Partial unique index, a clean conflict error, and an eligibility response that reports existing returns |
| 2 | The label appears right after approval sometimes and only after a refresh other times | Race condition: approve responds instantly and the label worker finishes later | Generate the label inline during approve, keep SQS as the fallback, and poll in the UI while status is APPROVED |
| 3 | The merchant detail page shows an evidence upload widget under the customer's images | The upload component is rendered in the page body | Move it into the Reject modal only, and keep customer and merchant evidence in separate fields |
| 4 | Tapping "Track Status" after submitting opens the merchant Returns Queue | The button points at a merchant route, and the merchant session may also be active in the same browser | Add a public customer tracking page at `/track/<token>` and redirect there after submit |
| 5 | Unclear whether customers must log in | No customer access model was defined | Customers never log in. A random tracking token and an order number plus email lookup replace credentials |

## 1. Preventing Duplicate Return Requests

### Why it happens

The customer form looks up the order and lists its items. Nothing checks whether a return already exists for one of those items, so the same item can be submitted repeatedly and each request lands in the merchant queue. Disabling a button in the UI would hide the problem, but it would not stop a second request from another tab or from a direct API call. The rule has to be enforced in the database.

### Fix A: a partial unique index

Only one active return may exist per order line item.

```javascript
// returns model
returnSchema.add({ isActive: { type: Boolean, default: true } });

returnSchema.index(
  { orderId: 1, lineItemId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
```

Set `isActive` to false only when a return is REJECTED, and only if your policy lets a customer submit again after a rejection. Keep it true in every other state, including REFUNDED, so a refunded item cannot be returned a second time.

### Fix B: turn the database error into a clear response

```javascript
try {
  await returnsRepository.create(dto);
} catch (err) {
  if (err.code === 11000) {
    throw Errors.conflict('A return request already exists for this item');
  }
  throw err;
}
```

### Fix C: make the eligibility check report existing returns

For each item the eligibility endpoint should say whether it can be returned and why not:

```json
{ "sku": "TSHIRT-BLU-L", "returnable": false,
  "reason": "ALREADY_REQUESTED", "existingReturnStatus": "PENDING_REVIEW" }
```

The UI then shows that item greyed out with a status badge and no checkbox.

Decide the quantity rule up front. The simplest is one return per line item, even when the quantity is 2.

### Fix D: disable the submit button while a request is in flight

This stops accidental double clicks. The unique index is what makes duplicates impossible.

## 2. Label Generation Race Condition

### Why it happens

Approve returns immediately with a "processing" state and hands label creation to an SQS worker. If the UI refetches before the worker finishes, it shows APPROVED. If it refetches afterward, it shows LABEL_GENERATED. The result is inconsistent behavior that looks like a refresh bug.

### Fix A: generate the label inline

Building a PDF in memory takes milliseconds, so the merchant does not need to wait on a queue for it. Keep SQS only as the fallback if inline generation fails.

```javascript
async approveReturn(returnId, merchantId) {
  const ret = await repo.findById(returnId);
  assertValidTransition(ret.status, 'APPROVED');
  await repo.updateStatus(returnId, 'APPROVED');

  try {
    const key = await generateAndStoreLabel(ret);          // PDF to S3
    await repo.updateStatus(returnId, 'LABEL_GENERATED', { labelKey: key });
  } catch (err) {
    logger.warn({ returnId, err }, 'Inline label failed, enqueueing retry');
    await sqs.sendLabelJob(returnId);                      // worker retries, idempotent
  }
  return repo.findById(returnId);                          // response carries the final status
}
```

Because the response already contains the final status, the UI updates at once with no refresh.

### Fix B: poll while the status is APPROVED

This covers the fallback path where the worker is still running.

```javascript
useEffect(() => {
  if (ret.status !== 'APPROVED') return;
  let tries = 0;
  const id = setInterval(async () => {
    const fresh = await fetchReturn(ret.id);
    setRet(fresh);
    if (fresh.status !== 'APPROVED' || ++tries >= 15) clearInterval(id);
  }, 2000);
  return () => clearInterval(id);
}, [ret.status]);
```

### Operational check

Confirm the label worker is running before any demo. If it is not, queued messages are never consumed and a return stays on APPROVED indefinitely.

## 3. Merchant Evidence Upload Cleanup

### Rule

The merchant uploads evidence only when rejecting a return. On the detail page the merchant sees the customer's evidence read-only.

### Fix

```jsx
{/* customer evidence: read-only thumbnails */}
<EvidenceGallery images={ret.customerEvidence} />

{/* remove any <UploadEvidence /> from the page body */}

<RejectModal open={showReject}>
  <textarea name="rejectionReason" required />
  <UploadEvidence onUpload={setMerchantEvidence} />   {/* only here */}
  <button onClick={confirmReject}>Confirm Reject</button>
</RejectModal>
```

Store the two sets in separate fields, `customerEvidence` and `merchantEvidence`, so they never appear mixed together.

## 4. Customer Redirect Bug and the Tracking Page

### Cause

The Track Status button links to a merchant route such as `/returns`. When the merchant session is active in the same browser, that route simply opens, which is why the customer flow ends on the merchant queue. Test the customer flow in an incognito window so it cannot reuse the merchant session.

To find the wrong link:

```bash
grep -rn "Track Status\|track status" frontend/src
grep -rn "router.push\|href=" frontend/src/app/request-return
```

### Step 1: create a tracking token

```javascript
// returns.service.js, inside createReturnRequest
const trackingToken = crypto.randomBytes(24).toString('base64url');
const created = await repo.create({ ...dto, trackingToken });

return { returnId: created._id, trackingToken, status: created.status, uploadUrl };
```

Add `trackingToken` to the schema as `{ type: String, unique: true, index: true }`. Do not build the URL from the return ID. The customer has no login, so the token is their only proof of access and must not be guessable.

### Step 2: add a public endpoint that returns limited fields

```javascript
// returns.routes.js: no auth middleware, but rate limited
router.get('/track/:token', publicRateLimit, async (req, res, next) => {
  try {
    const ret = await repo.findByTrackingToken(req.params.token);
    if (!ret) throw Errors.notFound('Return');
    res.json({
      returnId: ret.displayId,
      itemName: ret.itemName,
      status: ret.status,
      timeline: ret.timeline,                       // stage and timestamp only
      rejectionReason: ret.status === 'REJECTED' ? ret.rejectionReason : null,
      labelUrl: ['LABEL_GENERATED', 'IN_TRANSIT', 'RECEIVED', 'REFUNDED'].includes(ret.status)
        ? await s3.getSignedDownloadUrl(ret.labelKey, 300)
        : null,
    });
  } catch (err) { next(err); }
});
```

Return only customer-safe fields. Never send merchant notes, merchant evidence, other items in the order, or the customer's email or address.

### Step 3: add the customer tracking page

```jsx
// frontend/src/app/track/[token]/page.jsx
export default async function TrackPage({ params }) {
  const res = await fetch(`${API_BASE}/api/returns/track/${params.token}`, { cache: 'no-store' });
  if (!res.ok) return <p>We couldn't find this return.</p>;
  const ret = await res.json();
  return <CustomerTimeline ret={ret} token={params.token} />;
}
```

A client component polls so status changes and the label link appear without a manual refresh:

```jsx
'use client';
export function CustomerTimeline({ ret: initial, token }) {
  const [ret, setRet] = useState(initial);
  useEffect(() => {
    if (['REFUNDED', 'REJECTED'].includes(ret.status)) return;   // terminal states
    const id = setInterval(async () => {
      const r = await fetch(`/api/returns/track/${token}`, { cache: 'no-store' });
      if (r.ok) setRet(await r.json());
    }, 5000);
    return () => clearInterval(id);
  }, [ret.status, token]);
  // render the timeline, label download link, and rejection reason
}
```

### Step 4: fix the redirect after submit

```jsx
const res = await submitReturn(payload);
router.push(`/track/${res.trackingToken}`);   // customer page, never /returns
```

Also show the tracking link on the success screen and put it in every notification.

### Step 5: lock the merchant routes

A customer must never reach `/returns`, even by typing the URL.

- **Next.js middleware:** redirect any `/dashboard` or `/returns` request to `/login` when there is no valid merchant session.
- **Backend:** every `/api/returns` route must run the auth middleware and a role check for MERCHANT or ADMIN, except `/track/:token`, the lookup endpoint, and the create endpoint.

Verify in incognito: visiting `/returns` while logged out must land on the login page. If it loads without a login, that is an access-control hole to fix first.

## 5. Customer Access Model

Customers never create an account and never enter a password.

| Step | What the customer does | What proves it is them |
|---|---|---|
| Start a return | Enters order number and checkout email | They know details of a real order |
| Submit | Fills in the form | Nothing further |
| Track status | Opens `/track/<random-token>` | The 24-byte random token in the URL |
| Return later | Uses the saved link or the emailed link | The same token |

### Order lookup with email

Order numbers are often sequential and easy to guess, so ask for the order number and the checkout email, and check both:

```javascript
const order = await ordersRepo.findByNumberAndEmail(orderNumber, email.toLowerCase());
if (!order) throw Errors.notFound('Order');   // same message whether number or email was wrong
```

Use one generic error for either mismatch so nobody can probe which order numbers exist, and rate-limit the endpoint.

### Who logs in

| Person | Login |
|---|---|
| Merchant | Email and password, JWT, role check |
| Customer | None. Order number plus email to start, tracking link to follow |

A "My Returns" page listing all of a customer's returns would need a magic-link email login. That is optional and not needed for the interview.

## 6. How the Customer Tracks Status

There are three entry points, all leading to `/track/<token>`.

1. **The redirect after submitting.** The customer lands directly on their tracking page and can bookmark it.
2. **The link in every notification.** Request received, approved, label ready, refunded, and rejected messages all carry the same link.
3. **A "Track my return" lookup** for customers who lost the link.

```text
Track your return
Order number: [ ORD-9021 ]
Email:        [ john@example.com ]
              [ Find my return ]
```

```javascript
router.post('/track/lookup', publicRateLimit, async (req, res, next) => {
  try {
    const { orderNumber, email } = req.body;
    const returns = await repo.findByOrderAndEmail(orderNumber, email.toLowerCase());
    if (!returns.length) throw Errors.notFound('Return');   // same message for any mismatch
    res.json(returns.map(r => ({
      displayId: r.displayId, itemName: r.itemName, trackingToken: r.trackingToken,
    })));
  } catch (err) { next(err); }
});
```

### What the tracking page shows

```text
Return #RET2031: Blue T-Shirt (L)

✓ Requested         26 Sep, 3:10 PM
✓ Approved          26 Sep, 4:02 PM
✓ Label generated   26 Sep, 4:02 PM     [Download return label]
○ In transit
○ Received
○ Refunded
```

- Completed stages show a tick and a time, and the current stage is highlighted.
- The label link appears once the label exists. It is a presigned S3 URL that expires in 5 minutes, and a fresh one is fetched on each page load.
- A rejected return shows "Rejected" and the merchant's reason, and the later stages are hidden.
- The page checks for updates every 5 seconds until the status is Refunded or Rejected.

### What the customer never sees

Merchant notes, merchant evidence images, other customers' data, and other items in the order.

## 7. Test Checklist

| # | Test | Expected result |
|---|---|---|
| 1 | Submit a return for an item, then check eligibility for the same order again | The item shows as already requested and cannot be selected |
| 2 | Call the create endpoint twice for the same item using the API directly | Second call returns a conflict error, and only one document exists |
| 3 | Approve a return as the merchant | Status is LABEL_GENERATED in the same response, with no refresh needed |
| 4 | Stop the label worker and force inline generation to fail | Status stays APPROVED, the UI polls, and the label appears once the worker resumes |
| 5 | Open a return detail page as the merchant | Customer evidence is read-only, and the upload widget appears only inside the Reject modal |
| 6 | Submit a return in an incognito window | You land on `/track/<token>`, not on the merchant queue |
| 7 | Approve that return in a normal window | The incognito page updates within a few seconds and shows the label link |
| 8 | Visit `/returns` in incognito while logged out | You are redirected to the login page |
| 9 | Use the "Track my return" lookup with a wrong email | Generic "not found" message, no hint about which field was wrong |
| 10 | Request `/api/returns/track/<random string>` | 404, and the response has no internal fields |

## 8. Files Likely to Change

| Area | File (names may differ in your repo) |
|---|---|
| Duplicate prevention | returns model, `returns.repository`, `returns.service`, eligibility controller and service |
| Label timing | `returns.service` (approve), label worker, return detail page component |
| Evidence cleanup | Return detail page, `RejectModal`, `EvidenceGallery`, `UploadEvidence` |
| Tracking | `returns.routes`, `returns.service` (token), new `/track/[token]` page, new `/track` lookup page, request-return form (redirect) |
| Route protection | Next.js `middleware`, `auth.middleware`, role check on the returns routes |
