# ReturnFlow — E-commerce Returns & Reverse Logistics Platform

> **Purpose:** Live, AWS-hosted portfolio project built for the PluginHive interview process.
> Demonstrates: ECS/Fargate, ALB, S3, Redis, SQS, SNS, OpenSearch, IAM, CloudWatch, API Gateway, Step Functions, CloudFront.

---

## 1. Project Summary

ReturnFlow is a merchant-facing dashboard that manages the reverse-logistics side of e-commerce: a customer requests a return, uploads evidence, a merchant approves or rejects it, a label is generated, the item is tracked back, and a refund is issued. The lifecycle is modeled as an explicit **state machine**, which is the architectural core of the project.

```text
PENDING_REVIEW → APPROVED → LABEL_GENERATED → IN_TRANSIT → RECEIVED → REFUNDED
              → REJECTED
```

---

## 2. Development Phases

### Phase 0 — Planning & Setup (Day 0–1)
- Repository created, branch strategy applied (see §6)
- AWS account guardrails: MFA on root, IAM admin user created, root login disabled for daily use
- AWS Budgets + Free Tier usage alerts enabled
- `.env.example` committed; real `.env` files never committed (see §7)

### Phase 1 — Core Application (No AWS)
- Next.js frontend scaffold, Node/Express backend scaffold, MongoDB Atlas connected
- Auth: JWT + bcrypt, role-based access (`ADMIN`, `MERCHANT`)
- Core CRUD: orders, return requests, merchant approval screen
- Local Docker Compose for dev parity (app + Mongo + Redis containers)
- Unit tests for business logic (state transitions, eligibility rules)

**Exit criteria:** app runs fully locally via `docker compose up`, all core flows pass tests.

### Phase 2 — AWS Deployment Baseline
- Dockerfile hardened (multi-stage, non-root, distroless/alpine base)
- Image pushed to **ECR**
- **ECS/Fargate** service running the container, minimal task size (0.25 vCPU / 0.5 GB)
- **ALB** in front of the ECS service, health checks configured
- **IAM** task role scoped to only what Phase 2 needs (ECR pull, CloudWatch logs)
- **CloudWatch** log group receiving container logs

**Exit criteria:** app is publicly reachable over HTTPS via ALB — this satisfies the JD's mandatory "live project hosted on AWS."

### Phase 3 — AWS Feature Integration
- **S3** — return photo uploads + generated return-label PDFs (private bucket, signed URLs only)
- **SQS** — decouples label generation and refund processing from the request/response cycle
- **SNS** — customer + merchant notifications on state changes
- **Redis (ElastiCache)** — return-eligibility cache, per-customer abuse/rate counters
- **OpenSearch** — merchant search across returns (customer, SKU, reason, status)
- **IAM** — policies expanded incrementally, least privilege per new service, no `*` resource/action pairs

**Exit criteria:** all 9 JD-relevant services are live and individually demonstrable.

### Phase 4 — Enhancement Layer (post-shortlisting, "add more AWS components")
- **Step Functions** — orchestrates the label-generation sub-flow (Approve → SQS → generate PDF → S3 → update DB → SNS) as an explicit visual state machine
- **API Gateway** — public entry point for a narrow webhook receiver (simulated carrier status callbacks) → Lambda, kept separate from the main ECS API
- **CloudFront** — CDN in front of the frontend's static assets / S3 bucket

**Exit criteria:** 11–12 services total, each with a genuine, explainable feature behind it — no service added purely to inflate the architecture diagram.

### Phase 5 — Polish & Interview Readiness
- Seed data script for a realistic demo (orders, returns in every state)
- Demo script rehearsed (see the 8-step walkthrough in project notes)
- Architecture diagram exported, IAM policies screenshotted, CloudWatch dashboard prepared
- Cost review: confirm Fargate/ALB/OpenSearch/Redis usage is within Free Plan credit; everything else confirmed Always Free

---

## 3. Repository Structure

```text
returnflow/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # lint, test, build on every PR
│       ├── cd-backend.yml          # build+push ECR, deploy ECS on merge to main
│       ├── cd-frontend.yml         # build, deploy static assets, invalidate CloudFront
│       └── security-scan.yml       # dependency + container + SAST scanning
│
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js app router pages
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/
│   │   │   ├── returns/
│   │   │   │   ├── [returnId]/
│   │   │   │   └── page.tsx
│   │   │   ├── search/
│   │   │   └── analytics/
│   │   ├── components/
│   │   │   ├── ui/                 # generic, reusable components
│   │   │   ├── returns/            # return-specific components
│   │   │   └── layout/
│   │   ├── features/
│   │   │   ├── auth/               # redux slice + api calls
│   │   │   ├── returns/
│   │   │   └── search/
│   │   ├── lib/
│   │   │   ├── api-client.ts       # centralized fetch wrapper, no raw fetch elsewhere
│   │   │   └── validators/         # zod schemas shared with backend contracts
│   │   ├── store/                  # Redux Toolkit store config
│   │   ├── styles/
│   │   └── types/
│   ├── public/
│   ├── .env.example
│   ├── next.config.js
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts              # validated env loading (fails fast if missing)
│   │   │   ├── aws.ts              # AWS SDK v3 clients, region/config only, no secrets
│   │   │   └── db.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.schema.ts  # request validation (zod/joi)
│   │   │   │   └── auth.test.ts
│   │   │   ├── returns/
│   │   │   │   ├── returns.controller.ts
│   │   │   │   ├── returns.service.ts
│   │   │   │   ├── returns.repository.ts
│   │   │   │   ├── returns.state-machine.ts
│   │   │   │   ├── returns.routes.ts
│   │   │   │   ├── returns.schema.ts
│   │   │   │   └── returns.test.ts
│   │   │   ├── orders/
│   │   │   ├── notifications/      # SNS wrapper
│   │   │   ├── search/             # OpenSearch client + query builders
│   │   │   └── cache/              # Redis wrapper, eligibility + abuse counters
│   │   ├── workers/
│   │   │   ├── label-worker.ts     # SQS consumer: generate label PDF → S3
│   │   │   └── refund-worker.ts    # SQS consumer: process refund
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts # single error-handling boundary, no stack leaks
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── lib/
│   │   │   ├── logger.ts           # structured logging, no PII/secrets logged
│   │   │   ├── s3-client.ts        # signed-URL helpers only, no public ACLs
│   │   │   └── sqs-client.ts
│   │   ├── app.ts                  # express app assembly, helmet/cors/rate-limit wired here
│   │   └── server.ts               # entrypoint only
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
│
├── infra/
│   ├── docker-compose.yml          # local dev: app + mongo + redis
│   ├── docker-compose.prod.yml
│   ├── terraform/                  # optional IaC, one module per AWS service
│   │   ├── modules/
│   │   │   ├── ecs/
│   │   │   ├── alb/
│   │   │   ├── s3/
│   │   │   ├── sqs-sns/
│   │   │   ├── opensearch/
│   │   │   ├── redis/
│   │   │   ├── iam/
│   │   │   ├── step-functions/
│   │   │   ├── api-gateway/
│   │   │   └── cloudfront/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   └── prod/
│   │   └── main.tf
│   └── step-functions/
│       └── label-generation.asl.json   # Amazon States Language definition
│
├── scripts/
│   ├── seed-demo-data.ts
│   └── check-env.sh
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEMO_SCRIPT.md
│   └── IAM_POLICIES.md
│
├── .gitignore
├── .dockerignore
├── .env.example                    # root-level, documents ALL required vars, no values
├── SECURITY.md
└── README.md
```

---

## 4. Git Branching Strategy

```text
main                    → always deployable, protected, maps to production ECS service
 └── develop             → integration branch, maps to a staging/demo ECS service
      ├── feature/auth-jwt
      ├── feature/return-state-machine
      ├── feature/s3-label-upload
      ├── feature/sqs-label-worker
      ├── feature/sns-notifications
      ├── feature/redis-eligibility-cache
      ├── feature/opensearch-search
      ├── feature/step-functions-orchestration
      ├── feature/api-gateway-webhook
      ├── feature/cloudfront-cdn
      ├── release/v1.0.0          → cut from develop, only bugfixes, merges to main + develop
      └── hotfix/*                → cut from main for urgent prod fixes, merges to main + develop
```

**Rules:**
- `main` and `develop` are protected: no direct pushes, PR + at least one passing CI run required.
- Branch naming is enforced: `feature/*`, `release/*`, `hotfix/*`, `chore/*`, `docs/*` only.
- One feature branch = one AWS service or one cohesive unit of work — keeps PRs reviewable and keeps the git history itself a readable map of "which commit introduced which service," which doubles as interview material.
- Squash-merge feature branches into `develop` with a conventional commit message (`feat(sqs): add label-generation worker`).
- Tag every merge to `main` (`v1.0.0`, `v1.1.0`, …); CD workflow deploys only on tagged releases, not every merge.

---

## 5. Security Rules (Zero-Vulnerability Baseline)

These are non-negotiable across both frontend and backend code.

### 5.1 Secrets & configuration
- No secrets, API keys, DB URIs, or AWS credentials ever committed — `.env` is git-ignored, only `.env.example` (keys, no values) is committed.
- Runtime secrets come from **AWS Secrets Manager** or ECS task-definition environment injection — never baked into the Docker image.
- `env.ts` validates all required environment variables at boot and **fails fast** if any are missing or malformed — no silent fallback to insecure defaults.

### 5.2 Input handling
- Every route validates its request body/params/query against a schema (zod/Joi) **before** it reaches business logic — no controller trusts raw `req.body`.
- All MongoDB queries use the driver's parameterized operators; no string-concatenated queries, no `$where` with user input.
- File uploads (return photos) are validated by MIME type and size limit server-side, not just trusted from the client `Content-Type` header; re-encoded or scanned before storage.

### 5.3 AuthN/AuthZ
- Passwords hashed with bcrypt (cost factor ≥ 12), never stored or logged in plaintext.
- JWTs are short-lived access tokens + rotating refresh tokens; signing secret pulled from Secrets Manager, never hardcoded.
- Role checks (`ADMIN`, `MERCHANT`) enforced server-side on every protected route — never trust a role claim without re-verifying it against the DB on sensitive actions.
- Rate limiting on auth endpoints specifically (login/register) to blunt credential stuffing.

### 5.4 Transport & headers
- HTTPS-only end to end (ALB listener on 443, HTTP redirects to HTTPS).
- `helmet` middleware sets standard security headers (CSP, X-Content-Type-Options, X-Frame-Options, HSTS).
- CORS explicitly allow-lists the frontend origin(s) — never `origin: '*'` on an authenticated API.

### 5.5 AWS-specific
- IAM roles follow least privilege per component; no task role ever holds `AdministratorAccess`.
- S3 buckets are private by default; objects served only via time-limited signed URLs, never public ACLs.
- No hardcoded AWS access keys anywhere in the codebase — ECS tasks use the attached IAM role; local dev uses named CLI profiles, not embedded keys.
- Security groups scoped to minimum required ports/sources (e.g., Redis/OpenSearch only reachable from the ECS task's security group, never `0.0.0.0/0`).

### 5.6 Dependency & code hygiene
- `npm audit` / `npm audit fix` run in CI on every PR; build fails on any **high/critical** vulnerability.
- Dependabot (or Renovate) enabled for automated dependency PRs.
- No `eval`, no dynamic `require`/`import` from user input, no unsanitized `dangerouslySetInnerHTML` on the frontend.
- Linting (ESLint with a security plugin, e.g. `eslint-plugin-security`) and formatting (Prettier) enforced in CI — PRs cannot merge with lint errors.
- Structured logging only; no PII, tokens, or secrets ever written to logs or CloudWatch.

---

## 6. Docker Setup

### Backend `Dockerfile` (multi-stage, hardened)
```dockerfile
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
USER appuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/server.js"]
```

**Rules applied:** multi-stage build (no build tools in final image), non-root `USER`, no secrets via `ARG`/`ENV` in the image, explicit `HEALTHCHECK` for ECS/ALB target-group health, minimal Alpine base to shrink attack surface.

### `.dockerignore`
```text
node_modules
npm-debug.log
.env
.env.*
!.env.example
.git
.github
tests
*.md
Dockerfile
docker-compose*.yml
```

### `infra/docker-compose.yml` (local dev only)
```yaml
services:
  backend:
    build: ../backend
    ports: ["4000:4000"]
    env_file: ../backend/.env
    depends_on: [mongo, redis]
  frontend:
    build: ../frontend
    ports: ["3000:3000"]
    env_file: ../frontend/.env
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
volumes:
  mongo-data:
```

---

## 7. CI/CD — GitHub Actions

### `.github/workflows/ci.yml`
Runs on every PR into `develop` or `main`:
1. Checkout, setup Node (matrix: backend + frontend)
2. `npm ci`
3. Lint (`eslint`) + format check (`prettier --check`)
4. Unit + integration tests with coverage threshold gate
5. `npm audit --audit-level=high` (fails build on high/critical CVEs)
6. Docker image build (no push) to confirm the image builds cleanly

### `.github/workflows/security-scan.yml`
Runs on every PR + nightly on `main`:
1. Dependency scan (`npm audit` / Snyk or Grype)
2. Container image scan (Trivy) against the built image — fails on high/critical
3. Static analysis (CodeQL) for JS/TS

### `.github/workflows/cd-backend.yml`
Runs on tagged release to `main`:
1. Build production Docker image
2. Push to **ECR** (tagged with git SHA + semver)
3. Register new ECS task definition revision
4. Update ECS service (rolling deployment), wait for stable health checks via ALB target group
5. Post-deploy smoke test against `/health`

### `.github/workflows/cd-frontend.yml`
Runs on tagged release to `main`:
1. Build static frontend assets
2. Sync to S3 bucket
3. Invalidate **CloudFront** distribution cache

**Secrets used by workflows** (stored in GitHub Actions encrypted secrets, never in code): `AWS_ROLE_TO_ASSUME` (OIDC federation — no long-lived AWS keys in GitHub at all), `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `CLOUDFRONT_DISTRIBUTION_ID`.

> **Note on AWS auth in CI:** use GitHub's OIDC provider + an IAM role with a trust policy scoped to this repo, instead of storing static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets. This removes long-lived credentials from GitHub entirely.

---

## 8. Environment Variables (documented, not committed)

`backend/.env.example`
```env
NODE_ENV=development
PORT=4000
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
AWS_REGION=
S3_BUCKET_NAME=
SQS_LABEL_QUEUE_URL=
SQS_REFUND_QUEUE_URL=
SNS_TOPIC_ARN=
OPENSEARCH_ENDPOINT=
```

`frontend/.env.example`
```env
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CLOUDFRONT_URL=
```

---

## 9. Demo Readiness Checklist

- [ ] All 8 JD-required services deployed and individually demonstrable
- [ ] Step Functions, API Gateway, CloudFront added and each tied to a real feature
- [ ] Seed data covers every state in the return lifecycle
- [ ] IAM policies screenshotted for the walkthrough (shows least privilege, not `*`)
- [ ] CloudWatch dashboard/log group open and ready to tail live during the demo
- [ ] `npm audit` and Trivy scan both clean (zero high/critical) on the `main` branch
- [ ] Architecture diagram (this document's §3 + a services diagram) printed or ready to share on screen
- [ ] Cost check: Fargate/ALB/OpenSearch/Redis usage confirmed within Free Plan credit

---

## 10. Explicit Non-Goals

To keep the project explainable end-to-end, the following are deliberately **out of scope**:
- Kubernetes/EKS, Kafka, Lambda@Edge, multi-region failover, WAF, Route 53 custom domains
- Microservice-per-feature decomposition — this stays a modular monolith with clear module boundaries, not a distributed-services project
- Any service added without a genuine, demoable feature behind it

The goal is a **small, deeply-understood system**, not a maximal one.
