# Security Policy — ReturnFlow

ReturnFlow follows a strict **zero-vulnerability baseline** across frontend, backend, and cloud infrastructure.

## 1. Core Security Guarantees

### 1.1 Secrets & Configuration
- **No secrets in source control:** `.env` files are strictly git-ignored. Only `.env.example` containing variable names without credentials is committed.
- **Fail-fast validation:** Application startup executes Zod schema validation via `backend/src/config/env.ts`. Any missing or malformed configuration aborts the process immediately.
- **Production secret delivery:** Runtime secrets are injected via AWS Secrets Manager or ECS task environment injection — never baked into Docker images.

### 1.2 Input Handling & Sanitization
- **Strict schema validation:** All API endpoints validate request body, route parameters, and query strings using Zod schemas (`backend/src/middleware/validate.middleware.ts`) before invoking business logic.
- **NoSQL injection defense:** All database operations utilize Mongoose typed models and parameterized driver methods. Query string concatenation and raw `$where` clauses are prohibited.
- **File upload validation:** Photos and return evidence are verified server-side for allowed MIME types and size constraints before presigned S3 URLs are issued.

### 1.3 Authentication & Authorization
- **Password security:** Password hashing uses `bcrypt` with work factor ≥ 12. Plaintext passwords are never logged, persisted, or returned.
- **Token lifecycle:** Short-lived JWT access tokens are held in client memory only; rotating refresh tokens are transmitted via `httpOnly`, `Secure`, `SameSite=strict` cookies.
- **Role-Based Access Control (RBAC):** Every mutating route enforces role verification (`MERCHANT`, `ADMIN`) on the server. Client claims are never implicitly trusted.
- **Brute-force protection:** Rate limiting is enforced via Redis-backed middleware on authentication endpoints.

### 1.4 Transport & Headers
- **Encryption:** TLS/HTTPS is enforced at all public boundaries (ALB listener 443 with automatic HTTP-to-HTTPS redirect).
- **Security headers:** `helmet` applies Content Security Policy (CSP), HSTS, X-Content-Type-Options, and X-Frame-Options.
- **CORS:** Only explicitly allow-listed client origins are granted access. Wildcard (`*`) CORS is strictly forbidden on authenticated endpoints.

### 1.5 AWS Least Privilege
- IAM roles are scoped to specific ARNs and actions without wildcard `*` permissions.
- S3 buckets block all public access; read and write access is handled exclusively via short-lived presigned URLs.

## 2. Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately:
1. Open an issue with a security-advisory tag or email the repository maintainers.
2. Provide reproduction steps, potential impact, and suggested mitigations.
3. Allow up to 48 hours for acknowledgment before any public disclosure.
