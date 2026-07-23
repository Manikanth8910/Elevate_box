# Design Principles
- **Separation of Concerns**: Controllers only handle HTTP. Services handle business logic.
- **Role-Based Access Control (RBAC)**: All APIs enforce permissions at the route/middleware level.
- **Immutable Audit Logs**: Every state change triggers an immutable audit log via transactions.
- **Optimistic Concurrency**: Document updates require version matching.
