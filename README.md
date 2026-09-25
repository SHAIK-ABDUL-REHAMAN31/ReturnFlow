# ReturnFlow — Reverse Logistics & E-Commerce Returns Platform

> **Production-grade, live AWS-hosted reverse logistics platform built with 100% Pure JavaScript (Node.js 22 ESM + React/Next.js 16).**  
> Demonstrates full-lifecycle integration across 12 AWS services: **ECS/Fargate, Application Load Balancer (ALB), S3, SQS, SNS, ElastiCache (Redis), OpenSearch Service, Step Functions, CloudWatch, CloudFront, Secrets Manager, and IAM**.

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│             Next.js 16 Frontend (Turbopack, JSX)            │
│   (Merchant Console, Customer Portal, Vanilla CSS Tokens)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON (JWT In-Memory)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Application Load Balancer (ALB)                 │
│         (TLS 443 -> Port 4000, Container Health Checks)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Private VPC
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          ECS Fargate Tasks (Node.js 22 ES Modules)          │
│    ┌────────────┐     ┌───────────┐     ┌────────────┐      │
│    │ Controller │ ──► │  Service  │ ──► │ Repository │      │
│    └────────────┘     └───────────┘     └────────────┘      │
│          ▲                  ▲                 │             │
│          │                  │                 ▼             │
│    ┌────────────┐     ┌───────────┐     ┌────────────┐      │
│    │ Zod Schema │     │State Mach.│     │  MongoDB   │      │
│    └────────────┘     └───────────┘     └────────────┘      │
└─────────────┬───────────────────┬─────────────┬─────────────┘
              │                   │             │
              ▼                   ▼             ▼
       ┌───────────────┐   ┌───────────────┐ ┌─────────────┐
       │  ElastiCache  │   │ SQS & Workers │ │ S3 Buckets  │
       │ (Redis Cache) │   │ (Async Queue) │ │(Presigned)  │
       └───────────────┘   └───────────────┘ └─────────────┘
              ▲                   ▲             ▲
              │                   │             │
       ┌───────────────┐   ┌───────────────┐ ┌─────────────┐
       │  OpenSearch   │   │Step Functions │ │ CloudWatch  │
       │(Search Engine)│   │ (Visual ASL)  │ │(EMF Metrics)│
       └───────────────┘   └───────────────┘ └─────────────┘
```

### Deterministic State Machine Engine
Every return request transitions through a strict, table-driven transition matrix:
```text
PENDING_REVIEW ──► APPROVED ──► LABEL_GENERATED ──► IN_TRANSIT ──► RECEIVED ──► REFUNDED
              └──► REJECTED
```
Illegal state jumps are rejected immediately with `409 INVALID_STATE_TRANSITION` before any database writes or worker side effects occur.

---

## 2. Integrated AWS Services (12 Services)

| AWS Service | Production Implementation | Zero-Vulnerability Architecture |
| :--- | :--- | :--- |
| **ECS / Fargate** | Node 22 ESM backend service running non-root container | Multi-stage Docker build, zero local file writes |
| **Application Load Balancer (ALB)** | HTTPS termination with HTTP $\to$ HTTPS redirection | Real-time container health checks (`/health`), Helmet security headers |
| **Amazon S3** | Evidence photos & shipping label PDFs | Strictly private bucket; presigned `PUT` & `GET` URLs (5–15 min expiry) |
| **Amazon SQS** | Async label worker & refund processing queues | Decoupled from request-response cycle; 20s long-polling, DLQ after 3 retries |
| **Amazon SNS** | Status update event broadcasts | Real-time topic fanout (`return.approved`, `carrier.status_update`, etc.) |
| **ElastiCache (Redis)** | Order eligibility cache & atomic rate counters | Atomic abuse rate limiter (`MULTI` INCR + EXPIRE); in-memory fallback |
| **Amazon OpenSearch** | Merchant multi-field search engine | Parameterized query template; automatic MongoDB regex fallback |
| **AWS Step Functions** | Label generation visual state machine | Deterministic ASL definition ([`label-generation.asl.json`](file:///d:/ReturnFlow/infra/step-functions/label-generation.asl.json)) |
| **Amazon CloudWatch** | Structured logs, EMF metrics & 5 alarms | Embedded Metric Format (EMF) stdout logging; zero PII / token leaks |
| **Amazon CloudFront** | CDN edge caching for static Next.js assets | HTTPS-only distribution with compression and security response headers |
| **AWS Secrets Manager** | Database credentials & JWT secret keys | Injected into container runtime environment at boot; never committed |
| **AWS IAM** | Least-privilege role policies per component | Scoped policies with zero wildcards ([`IAM_POLICIES.md`](file:///d:/ReturnFlow/docs/IAM_POLICIES.md)) |

---

## 3. Security & Zero-Vulnerability Standards

- **100% Pure JavaScript:** Built in ES Modules (Node 22) and JSX (Next.js 16). Zero TypeScript files.
- **Found 0 Vulnerabilities:** Continuous dependency audits (`npm audit` reports 0 vulnerabilities across frontend and backend).
- **In-Memory JWT Tokens:** Access tokens stored strictly in memory (Redux); refresh tokens stored in secure, `httpOnly`, `SameSite=Strict` cookies.
- **Timing-Safe HMAC Webhooks:** Carrier callback signatures verified using `crypto.timingSafeEqual` and raw wire bytes (`req.rawBody`).
- **Direct-to-S3 Uploads:** Files upload directly from the customer's browser to S3 via presigned `PUT` URLs; Node containers never store files on disk.
- **Fail-Fast Configuration:** `env.js` validates all environment variables at startup using Zod and exits immediately on misconfiguration.
- **Single Error Boundary:** Centralized error-handling middleware logs full internal errors while masking sensitive details from clients.

---

## 4. Repository Structure

```text
ReturnFlow/
├── .github/workflows/          # CI/CD pipelines (ci, cd-backend, cd-frontend, security-scan)
├── backend/                    # Express + Pure JS ESM + Mongoose + Redis backend
│   ├── src/
│   │   ├── config/             # Zod env validation, DB, Redis, AWS SDK v3 singletons
│   │   ├── modules/            # auth, returns, orders, search, webhooks, analytics, demo
│   │   ├── workers/            # SQS background workers (label-worker, refund-worker, runner)
│   │   ├── middleware/         # auth, error boundary, rate-limit, zod validate
│   │   ├── lib/                # app-error, logger, s3, sqs, sns, sfn, metrics, cache
│   │   ├── app.js              # Express application assembly & security headers
│   │   └── server.js           # Server bootstrap & graceful shutdown
│   └── tests/                  # Vitest unit and integration test suites (29 tests)
├── frontend/                   # Next.js 16 Turbopack merchant console & customer portal
│   ├── src/
│   │   ├── app/                # Pages (auth, dashboard, returns, new return, search, analytics)
│   │   ├── components/         # ui, returns, layout, DemoBar, visualizers
│   │   ├── features/           # Redux slices (auth, returns)
│   │   ├── lib/                # api-client, validators
│   │   └── styles/             # Vanilla CSS design token system (globals.css)
├── infra/                      # Infrastructure configurations
│   ├── docker-compose.yml      # Local dev stack (mongo, redis, backend, frontend)
│   ├── docker-compose.prod.yml # Production multi-container stack
│   ├── cloudwatch/             # Dashboards and 5 production alarms JSON
│   └── step-functions/         # Amazon States Language definition
├── scripts/                    # Automation scripts
│   ├── seed-demo-data.js       # Realistic e-commerce return data seeder
│   └── smoke-test.js           # Automated 8-step end-to-end system smoke test
├── docs/                       # Project documentation
│   ├── ARCHITECTURE.md         # Detailed component specification
│   ├── DEMO_SCRIPT.md          # 8-step interview walkthrough guide
│   ├── IAM_POLICIES.md         # Least-privilege IAM policies
│   └── COST_ANALYSIS.md        # AWS Free Tier & cost optimization review
├── SECURITY.md                 # Security baseline documentation
└── README.md
```

---

## 5. Quickstart — Local Development

### Prerequisites
* Node.js >= 20.x (Node 22 recommended)
* Docker & Docker Compose
* Git

### Option A: Running with Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/SHAIK-ABDUL-REHAMAN31/ReturnFlow.git
cd ReturnFlow

# Start full local stack
docker compose -f infra/docker-compose.yml up --build
```
* **Merchant Console:** `http://localhost:3000/dashboard`
* **Customer Returns Portal:** `http://localhost:3000/returns/new`
* **Backend API & Healthcheck:** `http://localhost:4000/health`

### Option B: Running Natively
```bash
# 1. Start MongoDB and Redis (or use Docker)
docker run -d -p 27017:27017 --name rf-mongo mongo:7
docker run -d -p 6379:6379 --name rf-redis redis:7-alpine

# 2. Start Backend
cd backend
npm install
npm run seed     # Populate realistic demo orders and returns
npm run dev

# 3. Start Frontend (in a separate terminal)
cd ../frontend
npm install
npm run dev
```

---

## 6. Testing & Quality Verification

```bash
# Run backend unit and integration test suite (29/29 passed)
cd backend
npm test

# Run automated 8-step system smoke test
npm run test:smoke

# Run frontend production build (10/10 routes compiled)
cd ../frontend
npm run build

# Run security vulnerability audit (found 0 vulnerabilities)
npm audit
```

---

## 7. Interview Demonstration Walkthrough

Follow the structured 8-step demo script in [`docs/DEMO_SCRIPT.md`](file:///d:/ReturnFlow/docs/DEMO_SCRIPT.md) to showcase:
1. In-memory JWT authentication.
2. Real-time KPI dashboard and interactive Demo Bar.
3. 30-day customer return eligibility verification.
4. Direct-to-S3 photo evidence upload via presigned `PUT` URL.
5. Merchant approval and AWS Step Functions / SQS orchestration.
6. Presigned S3 PDF shipping label download.
7. Simulated carrier webhook callbacks with timing-safe HMAC signatures.
8. Warehouse receipt, automated refund, and state machine 409 conflict defense.

---

## 8. License

MIT License. Designed and maintained for production reverse logistics and technical portfolio demonstrations.
