# Security Posture

The Document Approval System implements defense-in-depth methodologies.

## OWASP Top 10 Mitigations
1. **Broken Access Control**: Enforced deeply via `PolicyEngine` (ABAC/RBAC).
2. **Cryptographic Failures**: `bcrypt` used for passwords (rounds=10). Strict JWT expiration.
3. **Injection Flaws**: Prisma ORM neutralizes SQL Injection by default.
4. **Security Misconfiguration**: `helmet` utilized to set rigid HTTP headers (HSTS, NoSniff).

## Rate Limiting
- **Global API Limit**: 100 requests / 15 min per IP.
- **Auth Endpoint Limit**: 10 requests / 1 hr per IP (Brute-force protection).

## Audit & Compliance
- **Immutable Ledger**: The `AuditLog` table strictly enforces immutability. No API exists to `DELETE` or `UPDATE` logs.
- **Traceability**: All requests are injected with an `x-request-id` header which travels down to the Winston JSON logger.

## Error Handling
Stack traces are explicitly disabled in the production `error.middleware.ts`. Errors emit standard codes (e.g., `DOCUMENT_VERSION_CONFLICT`) instead of DB exceptions.
