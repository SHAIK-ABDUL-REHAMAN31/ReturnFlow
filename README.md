# ReturnFlow — E-commerce Returns & Reverse Logistics Platform

> **Live, AWS-hosted portfolio & production-grade reverse logistics platform.**
> Demonstrates: ECS/Fargate, ALB, S3, Redis, SQS, SNS, OpenSearch, IAM, CloudWatch, API Gateway, Step Functions, CloudFront.

---

## 1. Project Overview

ReturnFlow is a merchant-facing dashboard and reverse-logistics engine that manages the post-purchase return lifecycle: customer requests, evidence upload, merchant review/approval, PDF shipping label generation, return tracking, warehouse receipt, and automated refund processing.

The entire lifecycle is modeled as an **explicit, deterministic state machine**:

```text
PENDING_REVIEW ──► APPROVED ──► LABEL_GENERATED ──► IN_TRANSIT ──► RECEIVED ──► REFUNDED
              └──► REJECTED
```

---

## 2. Architecture & Design Principles

```text
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 14+ Frontend                      │
│        (App Router, Redux Toolkit, Tailwind, Lucide)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (JWT in-memory)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Express / TypeScript Backend                 │
│      Controller ──► Service ──► Repository ──► MongoDB      │
│            │             │                                  │
│            ▼             ▼                                  │
│       Zod Schema    State Machine                           │
└────────────┬─────────────┬─────────────┬────────────────────┘
             │             │             │
             ▼             ▼             ▼
       Redis Cache     SQS Queues     S3 Storage
      (Eligibility)    (Workers)      (Labels & Photos)
```

- **Separation of Concerns:** Controller (HTTP parsing) → Service (Business rules) → Repository (MongoDB queries) → AWS Clients.
- **Fail-Fast Configuration:** `backend/src/config/env.ts` uses Zod to validate required runtime configuration on startup.
- **Single Error Handling Boundary:** All errors route to `errorMiddleware`, returning structured machine-readable error codes without leaking internal stack traces.
- **At-Least-Once Delivery Resilience:** Asynchronous workers check return statuses for idempotency before performing operations.

---

## 3. Directory Layout

```text
returnflow/
├── .github/workflows/          # CI/CD pipelines (ci, cd-backend, cd-frontend, security-scan)
├── backend/                    # Express + TypeScript + Mongoose + Redis backend
│   ├── src/
│   │   ├── config/             # Zod env validation, DB, Redis, AWS SDK v3
│   │   ├── modules/            # auth, returns, orders, search, notifications
│   │   ├── workers/            # SQS background workers (label, refund)
│   │   ├── middleware/         # auth, error, rate-limit, validate
│   │   ├── lib/                # app-error, logger, s3, sqs, redis cache
│   │   ├── app.ts              # Express application assembly
│   │   └── server.ts           # Server bootstrap
│   └── tests/                  # Unit and integration test suites
├── frontend/                   # Next.js App Router merchant dashboard & portal
│   ├── src/
│   │   ├── app/                # Pages (auth, dashboard, returns, new return)
│   │   ├── components/         # ui, returns, layout components
│   │   ├── features/           # Redux slices (auth, returns)
│   │   ├── lib/                # api-client, validators
│   │   └── store/              # Redux store configuration
├── infra/                      # Infrastructure as Code
│   ├── docker-compose.yml      # Local dev stack (mongo, redis, backend, frontend)
│   └── step-functions/         # ASL state machine definitions
├── scripts/                    # Demo data seeding and environment validation
├── docs/                       # Architecture, demo scripts, IAM policies
└── SECURITY.md                 # Zero-vulnerability security specifications
```

---

## 4. Quickstart — Local Development

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose
- Git

### Running with Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/SHAIK-ABDUL-REHAMAN31/ReturnFlow.git
cd ReturnFlow

# Start full local stack (Frontend, Backend, Mongo, Redis)
docker compose -f infra/docker-compose.yml up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`
- Healthcheck: `http://localhost:4000/health`

### Running Backend Locally
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Running Frontend Locally
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## 5. Development Phases

- **Phase 0: Planning & Setup** — Git strategy, security baseline, docs, and environment templates. *(Complete)*
- **Phase 1: Core Application (No AWS)** — Node/Express + Next.js + MongoDB + Redis + Auth + State Machine + Local Compose. *(In Progress)*
- **Phase 2: AWS Deployment Baseline** — Hardened Docker images, ECR, ECS/Fargate, ALB, CloudWatch logging.
- **Phase 3: AWS Feature Integration** — S3 presigned URLs, SQS workers, SNS notifications, Redis caching, OpenSearch querying.
- **Phase 4: Enhancement Layer** — Step Functions visual workflows, API Gateway carrier webhooks, CloudFront CDN.
- **Phase 5: Polish & Interview Readiness** — Seed data, rehearsed demo scripts, architecture diagrams, cost optimization checks.
