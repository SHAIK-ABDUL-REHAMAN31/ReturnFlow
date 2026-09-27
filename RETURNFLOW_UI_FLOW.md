# ReturnFlow — Complete UI Flow (Screen-by-Screen, Element-by-Element)

> Plain-text walkthrough. Every screen is listed with exactly what's on it, and every action shows where it leads next using --->.

---

## 1. LOGIN PAGE

**URL:** `/login`

**Contains:**
- ReturnFlow logo (top center)
- Email input field
- Password input field
- "Log In" button
- "Forgot password?" link (small, below the button)

**Actions:**
- Fill email + password, click "Log In" ---> **MERCHANT DASHBOARD (Overview)**
- Click "Forgot password?" ---> **FORGOT PASSWORD PAGE**
- Wrong credentials entered ---> stays on **LOGIN PAGE**, shows inline error text under the password field: "Invalid email or password"

---

## 2. FORGOT PASSWORD PAGE

**URL:** `/forgot-password`

**Contains:**
- Email input field
- "Send reset link" button
- "Back to login" link

**Actions:**
- Enter email, click "Send reset link" ---> shows confirmation text on the same page: "If an account exists for this email, a reset link has been sent"
- Click "Back to login" ---> **LOGIN PAGE**

---

## 3. APP SHELL (present on every page after login)

This isn't a separate page — it's the layout wrapper every logged-in screen sits inside.

**Contains:**
- **Top Navbar** (full width, always visible):
  - ReturnFlow logo (left)
  - Merchant name + dropdown arrow (right) — clicking opens:
    - "Settings" ---> **SETTINGS PAGE**
    - "Log Out" ---> logs out ---> **LOGIN PAGE**
  - Notification bell icon (right, next to merchant name) — shows a small red dot when there are unread notifications, clicking opens a dropdown list of recent notifications (e.g. "Return #RET2033 refunded")

- **Left Sidebar** (always visible, below the navbar):
  - "Dashboard" ---> **DASHBOARD (OVERVIEW) PAGE**
  - "Returns" ---> **RETURNS QUEUE (LIST) PAGE**
  - "Search" ---> **SEARCH PAGE**
  - "Analytics" ---> **ANALYTICS PAGE**
  - "Settings" ---> **SETTINGS PAGE**

- **Main content area** (center/right): this is where each individual page below renders.

---

## 4. DASHBOARD (OVERVIEW) PAGE

**URL:** `/dashboard`

**Contains:**
- Page title: "Overview"
- Three summary count cards, side by side:
  - "Pending" card — shows a number (count of returns in PENDING_REVIEW)
  - "Approved" card — shows a number (count of returns in APPROVED/LABEL_GENERATED/IN_TRANSIT combined)
  - "Refunded" card — shows a number (count of returns in REFUNDED)
- "Recent Returns" section, below the cards:
  - A short list (last 5) of returns, each row showing: Return ID, Customer name, Reason, Status badge
  - Each row is clickable ---> **RETURN DETAIL PAGE** for that specific return

**Actions:**
- Click any card ---> **RETURNS QUEUE (LIST) PAGE**, pre-filtered to that status
- Click any row in "Recent Returns" ---> **RETURN DETAIL PAGE**

---

## 5. RETURNS QUEUE (LIST) PAGE

**URL:** `/returns`

**Contains:**
- Page title: "Returns"
- Search box (top right) — quick filter by customer name or return ID on this page only (different from the full Search page)
- Filter dropdown (top right, next to search box) — options: All, Pending, Approved, Label Generated, In Transit, Received, Refunded, Rejected
- A table with columns:
  - ID (e.g. RET2031)
  - Customer name
  - Reason
  - Status (colored badge — e.g. yellow for Pending, blue for Approved, green for Refunded, red for Rejected)
  - Action column — a button:
    - If status is Pending: button says "Review"
    - If any other status: button says "View"
- Pagination controls at the bottom (Previous / page numbers / Next)

**Actions:**
- Type in search box ---> table filters live, stays on **RETURNS QUEUE (LIST) PAGE**
- Select a filter option ---> table filters, stays on **RETURNS QUEUE (LIST) PAGE**
- Click "Review" or "View" on any row ---> **RETURN DETAIL PAGE** for that return

---

## 6. RETURN DETAIL PAGE — Pending State (the approval screen)

**URL:** `/returns/:returnId`

**Contains:**
- "← Back" link (top left) ---> **RETURNS QUEUE (LIST) PAGE**
- Page title: "Return #RET2031"
- Customer info block:
  - Customer name
  - Order number
  - Item name + variant (e.g. "T-Shirt, Blue, Size L")
  - Reason given by customer
  - "Submitted [time ago]" timestamp
- Evidence photo thumbnail (if customer uploaded one) — clicking it opens:
  - **PHOTO ENLARGE MODAL** (a popup overlay showing the full-size image, with an "X" close button)
- Status badge: "PENDING_REVIEW"
- Two buttons at the bottom:
  - "✕ Reject" button (red/outline style)
  - "✓ Approve" button (green/filled style)

**Actions:**
- Click evidence photo ---> **PHOTO ENLARGE MODAL** opens ---> click "X" ---> closes modal, stays on **RETURN DETAIL PAGE**
- Click "Approve" ---> button shows a loading spinner, disables itself immediately ---> on success, page re-renders as **RETURN DETAIL PAGE — Approved/Later State** (see below)
- Click "Reject" ---> a **CONFIRM REJECT MODAL** appears:
  - Text: "Are you sure you want to reject this return?"
  - "Cancel" button ---> closes modal, stays on this page
  - "Confirm Reject" button ---> return status becomes REJECTED, page re-renders showing status badge "REJECTED" and no further action buttons
- Click "← Back" ---> **RETURNS QUEUE (LIST) PAGE**

---

## 7. RETURN DETAIL PAGE — Approved/Later State (timeline view)

**URL:** `/returns/:returnId` (same URL, different content once status has moved past Pending)

**Contains:**
- "← Back" link (top left) ---> **RETURNS QUEUE (LIST) PAGE**
- Page title: "Return #RET2031"
- Status badge showing current state (e.g. "LABEL_GENERATED")
- A vertical timeline list, one row per lifecycle stage:
  - "✓ Requested — [time ago]"
  - "✓ Approved — [time ago]"
  - "✓ Label generated — [time ago]" with a "Download PDF" link next to it (only appears once label exists)
  - "○ In transit" (hollow circle if not yet reached, filled checkmark once reached)
  - "○ Received"
  - "○ Refunded"
- Conditional action button at the bottom, only one shown at a time depending on current status:
  - If status is `IN_TRANSIT`: "Mark as Received & Inspected" button
  - If status is `RECEIVED` or `REFUNDED`: no action button, just the timeline

**Actions:**
- Click "Download PDF" ---> opens/downloads the label PDF (via a presigned S3 URL), stays on this page
- Click "Mark as Received & Inspected" ---> button shows loading, disables ---> status updates to RECEIVED ---> page re-renders, timeline updates, refund processing begins in the background ---> eventually status shows REFUNDED on next page load/refresh
- Click "← Back" ---> **RETURNS QUEUE (LIST) PAGE**

---

## 8. SEARCH PAGE

**URL:** `/search`

**Contains:**
- Page title: "Search returns..."
- One large search input field (full width)
- "Search" button next to the input
- Results list below (same row format as the Returns Queue table: ID, Customer, Reason, Status)
- Empty state message when no query entered yet: "Type a customer name, SKU, or reason to search"
- No-results message if query returns nothing: "No returns match your search"

**Actions:**
- Type query, click "Search" (or press Enter) ---> results populate below, stays on **SEARCH PAGE**
- Click any result row ---> **RETURN DETAIL PAGE** for that return

---

## 9. ANALYTICS PAGE

**URL:** `/analytics`

**Contains:**
- Page title: "Analytics"
- "Top Return Reasons" section:
  - Horizontal bar chart, one bar per reason (e.g. Wrong size, Damaged, Not needed), each bar labeled with a percentage
- "Most-Returned SKUs" section:
  - A ranked numbered list (1, 2, 3...) of item names
- "Return Rate by Category" section:
  - A row of category names each with a percentage value (e.g. "Apparel: 8%")

**Actions:**
- This page is read-only — no buttons, no navigation triggers other than the sidebar itself
- (Optional, if built) clicking a bar/SKU/category ---> **SEARCH PAGE**, pre-filled with that term as the query

---

## 10. SETTINGS PAGE

**URL:** `/settings`

**Contains:**
- Page title: "Settings"
- "Account" section:
  - Merchant name (editable text field)
  - Email (read-only, or editable with re-verification)
  - "Save Changes" button
- "Notifications" section:
  - Toggle switches for: "Email me on new return requests", "Email me on refund completion"
- "Change Password" section:
  - Current password field
  - New password field
  - Confirm new password field
  - "Update Password" button

**Actions:**
- Edit any field, click "Save Changes" ---> shows a small success toast/banner: "Settings saved" ---> stays on **SETTINGS PAGE**
- Fill password fields, click "Update Password" ---> on success, shows confirmation toast; on mismatch/error, shows inline error text under the confirm-password field

---

## 11. CUSTOMER-FACING RETURN REQUEST FORM (the only screen the customer ever sees — no login)

**URL:** `/request-return` (public, separate from the merchant app entirely)

**Contains:**
- Page title: "Request a Return"
- "Order Number" input field
- "Item" dropdown (populates after order number is entered/looked up)
- "Reason" dropdown (fixed list: Wrong size, Damaged, Not needed, Wrong item received, Other)
- "Upload evidence" file picker (optional photo)
- "Submit Request" button

**Actions:**
- Fill all fields, click "Submit Request" ---> button shows loading ---> on success, page replaces the form with a confirmation message: "Your return request has been submitted. You'll receive an email once it's reviewed." ---> no further navigation, this is the end of the customer's involvement until they receive an email later
- Missing/invalid order number ---> inline error under that field: "Order not found"

---

## 12. NOTIFICATIONS (not a page — a component that appears across the app)

**Where it appears:**
- Notification bell dropdown in the top navbar (see App Shell, section 3)
- Toast/banner messages that appear briefly at the top or bottom of the screen after an action (e.g. "Settings saved", "Return approved")

**Contains (inside the bell dropdown):**
- A short list of recent events, each showing: a one-line description (e.g. "Return #RET2033 marked as refunded"), and a relative timestamp ("5 minutes ago")
- Clicking a notification item ---> **RETURN DETAIL PAGE** for the return it references

---

## 13. Full Navigation Map (all pages, all arrows, in one place)

```text
LOGIN PAGE
   │ (correct credentials)
   ▼
DASHBOARD (OVERVIEW) ──────────────┐
   │        │        │        │     │
   │        │        │        │     │ (sidebar always available from here on)
   ▼        ▼        ▼        ▼     │
RETURNS   SEARCH   ANALYTICS SETTINGS
QUEUE                                │
   │                                 │
   ▼                                 │
RETURN DETAIL (Pending) ─────────────┤
   │ Approve            │ Reject     │
   ▼                    ▼            │
RETURN DETAIL          RETURN DETAIL │
(Timeline view,        (Rejected,    │
 progresses through     dead end)    │
 Label Generated →                   │
 In Transit →                        │
 Received →                          │
 Refunded)                           │
                                      │
(any page) ── Log Out ────────────────┘
   │
   ▼
LOGIN PAGE


SEPARATE, PUBLIC, NO LOGIN:
CUSTOMER RETURN REQUEST FORM ---> confirmation message (dead end, no further pages)
```

---

## 14. Quick Reference — Which Page Has Which Fields (condensed table)

| Page | Key Fields/Elements |
|---|---|
| Login | Email, Password, Log In button, Forgot password link |
| Forgot Password | Email, Send reset link button |
| Dashboard (Overview) | Pending/Approved/Refunded count cards, Recent Returns list |
| Returns Queue | Search box, Status filter dropdown, table (ID, Customer, Reason, Status, Action), pagination |
| Return Detail (Pending) | Customer/order/item info, reason, photo thumbnail, Approve button, Reject button |
| Return Detail (Timeline) | Status badge, vertical timeline (6 stages), Download PDF link, Mark as Received button |
| Search | Search input, Search button, results list |
| Analytics | Top reasons bar chart, most-returned SKUs list, return rate by category |
| Settings | Account fields, notification toggles, change password fields |
| Customer Return Form | Order number, item dropdown, reason dropdown, photo upload, Submit button |
| App Shell (Navbar+Sidebar) | Logo, merchant name dropdown (Settings/Log Out), notification bell, sidebar links (Dashboard/Returns/Search/Analytics/Settings) |
