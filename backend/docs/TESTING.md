# Testing Strategy

## Pyramid
1. **Unit Tests**: Test pure functions, state machines, and validators (Vitest).
2. **Integration Tests**: Test repositories against a test database.
3. **API Tests**: Supertest endpoints.
4. **Workflow Tests**: End-to-end transition flows ensuring audits are written.

## Concurrency Tests
Explicit tests verifying `409 Conflict` on optimistic locking (version mismatch).
