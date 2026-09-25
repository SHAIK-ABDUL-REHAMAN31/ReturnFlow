# ReturnFlow — System Architecture & Component Specification

## 1. High-Level System Architecture

ReturnFlow is built as a production-grade reverse logistics platform designed for scalability, zero-vulnerability security, and complete auditability.

```text
┌────────────────────────────────────────────────────────┐
│                   Next.js Frontend                     │
│      (App Router, Redux Toolkit, Vanilla CSS tokens)   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS (Bearer JWT / httpOnly cookie)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Application Load Balancer (ALB)            │
│                 (TLS 443 -> Port 4000)                 │
└───────────────────────────┬────────────────────────────┘
                            │ Private VPC
                            ▼
┌────────────────────────────────────────────────────────┐
│               ECS / Fargate Tasks (Node.js)            │
│    ┌────────────┐     ┌───────────┐     ┌────────────┐ │
│    │ Controller │ ──► │  Service  │ ──► │ Repository │ │
│    └────────────┘     └───────────┘     └────────────┘ │
│          ▲                  ▲                 │        │
│          │                  │                 ▼        │
│    ┌────────────┐     ┌───────────┐     ┌────────────┐ │
│    │ Zod Schema │     │State Mach.│     │  MongoDB   │ │
│    └────────────┘     └───────────┘     └────────────┘ │
└─────────────┬───────────────────┬─────────────┬────────┘
              │                   │             │
              ▼                   ▼             ▼
      ┌───────────────┐   ┌───────────────┐ ┌─────────────┐
      │  ElastiCache  │   │ SQS & Workers │ │ S3 Buckets  │
      │ (Redis Cache) │   │ (Async Queue) │ │(Presigned)  │
      └───────────────┘   └───────────────┘ └─────────────┘
```

---

## 2. Core Modules & Responsibilities

### 2.1 State Machine Engine (`backend/src/modules/returns/returns.state-machine.js`)
All lifecycle status mutations pass through a pure, table-driven transition matrix:
```javascript
const TRANSITIONS = {
  PENDING_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['LABEL_GENERATED'],
  LABEL_GENERATED: ['IN_TRANSIT'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: ['REFUNDED'],
  REJECTED: [],
  REFUNDED: [],
};
```
Any invalid transition triggers a standardized `AppError(409, 'INVALID_STATE_TRANSITION', ...)` before any DB writes or side effects occur.

### 2.2 Layer Isolation Standard
- **Controller:** Exclusively handles HTTP request parsing, status responses, and invokes one service method.
- **Service:** Owns business logic, state machine validation, order eligibility, and event dispatch.
- **Repository:** Strictly the only layer that interacts with MongoDB collections.
- **AWS Clients:** Isolated singletons consuming IAM task roles.

---

## 3. Data & Storage Pipeline

- **MongoDB:** Primary system of record for orders, returns, and timeline audit logs.
- **Redis (ElastiCache):** SKU eligibility caching and atomic brute-force rate-limiting counters.
- **Amazon S3:** Private bucket for customer photos (via presigned PUT URLs) and generated shipping label PDFs.
- **Amazon SQS:** Decouples heavy operations (PDF label generation, payment gateway refunds) from API request cycles.
- **Amazon SNS:** Broadcasts real-time events (`return.created`, `return.approved`, `label.ready`, `refund.completed`).
