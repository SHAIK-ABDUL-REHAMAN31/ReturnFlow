# ReturnFlow — AWS Free Tier & Cost Optimization Architecture Review

> **Target Audience:** Technical Interviewers, Cloud Architects, Engineering Managers  
> **Key Objective:** Prove that all 9–12 AWS services integrated into ReturnFlow can run in a live demonstration environment for **$0 net expense** (or strictly under Free Tier credit allowances) while maintaining production-grade security, isolation, and observability.

---

## 1. Executive Cost Summary

| AWS Service | Architecture Role | Free Tier / Always Free Allocation | Demo Usage Target | Projected Monthly Cost |
| :--- | :--- | :--- | :--- | :--- |
| **AWS Fargate (ECS)** | Backend container (Node 22 ESM) | Minimal Task size (0.25 vCPU / 0.5 GB) | Continuous or on-demand demo runs | ~$9.00 / mo *(Offset by $300 AWS Credits)* |
| **Application Load Balancer (ALB)** | HTTPS termination, `/health` routing | 750 hours/mo + 15 LCUs (12 months free) | 1 ALB listener (HTTP $\to$ HTTPS) | **$0.00** |
| **Amazon S3** | Evidence photos & generated PDF labels | 5 GB Standard Storage, 20,000 GET, 2,000 PUT | < 100 MB private objects (Signed URLs) | **$0.00** |
| **Amazon SQS** | Async label worker & refund queues | **1,000,000 requests/mo (Always Free)** | ~1,000 jobs per demo cycle | **$0.00** |
| **Amazon SNS** | Lifecycle state change pub/sub topics | **1,000,000 publishes/mo (Always Free)** | ~1,000 status notifications | **$0.00** |
| **AWS Step Functions** | Label generation visual state machine | **4,000 state transitions/mo (Always Free)** | ~200 transitions per demo walkthrough | **$0.00** |
| **Amazon CloudWatch** | Logs, EMF metrics, 5 production alarms | 5 GB ingest, 10 custom metrics, 10 alarms | 1 dashboard, 5 alarms, EMF metrics | **$0.00** |
| **Amazon OpenSearch Service** | Multi-match search across returns | 750 hours/mo `t3.small.search` (12 months free) | 1 single-node domain with MongoDB fallback | **$0.00** |
| **Amazon ElastiCache (Redis)** | Abuse counters & eligibility caching | 750 hours/mo `cache.t2.micro` or `cache.t3.micro` | 1 single-node cluster with in-memory fallback | **$0.00** |
| **Amazon CloudFront** | CDN edge caching for static Next.js assets | **1 TB data transfer out/mo (Always Free)** | < 1 GB demo asset transfer | **$0.00** |
| **AWS Secrets Manager** | Database credentials & JWT secrets | $0.40/secret/mo | 1 secret (or task environment injection) | < $0.50 / mo |
| **TOTAL** | **Full 12-Service Live Architecture** | | | **$0.00 – $9.50/mo** |

---

## 2. Service-by-Service Cost Optimization Details

### 2.1 Amazon S3 (Zero Storage Waste & Zero Public ACLs)
* **Lifecycle Rule:** Objects in `returnflow-demo-bucket` under `labels/` and `evidence/` have a 7-day expiration lifecycle rule configured.
* **Direct Browser-to-S3 Uploads:** Files upload directly to S3 via 15-minute presigned `PUT` URLs. This prevents memory bloat on ECS Fargate containers and eliminates double-bandwidth costs.
* **Presigned Download URLs:** Labels download directly via 5-minute presigned `GET` URLs without keeping containers busy streaming bytes.

### 2.2 SQS & SNS (Always-Free Decoupling)
* **Long Polling (20s):** The background worker runner (`backend/src/workers/worker-runner.js`) utilizes `WaitTimeSeconds: 20` on SQS `ReceiveMessageCommand`. This reduces empty polling API calls by over **98%**, keeping total monthly calls well below the 1,000,000 free request limit.
* **Dead-Letter Queue (DLQ):** Messages are retried up to 3 times (`maxReceiveCount: 3`) before routing to `returnflow-label-dlq`, preventing runaway infinite-loop costs.

### 2.3 AWS Step Functions (Visual State Machine)
* Standard state machines provide 4,000 free state transitions per month.
* The label generation sub-flow ([`infra/step-functions/label-generation.asl.json`](file:///d:/ReturnFlow/infra/step-functions/label-generation.asl.json)) uses 5 state transitions per approved return:
  $$\frac{4,000 \text{ free transitions}}{5 \text{ transitions / return}} = 800 \text{ complete return lifecycles / month free}$$
* Local and test environments fall back gracefully to direct SQS dispatch, generating 0 billed transitions during automated test suites.

### 2.4 CloudWatch Embedded Metric Format (EMF)
* Instead of calling the expensive `PutMetricData` API for every state transition ($0.01 per 1,000 requests), ReturnFlow uses **CloudWatch EMF** via standard stdout JSON logs.
* CloudWatch automatically extracts custom metrics from structured log events asynchronously with **zero incremental API charges**.

### 2.5 Resilient Fallbacks (Zero Downtime / Zero Hard Dependencies)
* **ElastiCache (Redis):** If Redis is offline or stopped to save cost, [`cache.service.js`](file:///d:/ReturnFlow/backend/src/lib/cache.service.js) operates in degraded memory mode with automatic retry backoff.
* **OpenSearch:** If the OpenSearch domain is paused, [`opensearch-client.js`](file:///d:/ReturnFlow/backend/src/modules/search/opensearch-client.js) automatically falls back to MongoDB regex queries without returning errors to users.

---

## 3. Cost-Effective Teardown / Sleep Script

When the platform is not actively being demonstrated, the ECS service desired count can be scaled to `0` to halt Fargate compute billing:

```bash
# Pause compute between interview cycles ($0/hr)
aws ecs update-service --cluster returnflow-cluster --service returnflow-backend-service --desired-count 0

# Resume before an interview demonstration
aws ecs update-service --cluster returnflow-cluster --service returnflow-backend-service --desired-count 1
```
