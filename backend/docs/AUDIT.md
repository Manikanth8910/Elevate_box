# Audit & Integrity Systems

The Audit System operates exclusively on an immutable append-only ledger (`AuditLog`). This ensures enterprise-grade traceability and compliance.

## Event-Driven Audit Flow
Instead of bloating the transaction boundaries with heavy analytical logging, the system leverages Domain Events (via the `globalEventBus`).

```mermaid
sequenceDiagram
    participant API as ReviewController
    participant TX as TransactionManager
    participant DB as Database
    participant Bus as Event Bus
    participant Audit as AuditSubscriber

    API->>TX: execute(Approve)
    TX->>DB: UPDATE Document (v++)
    TX->>DB: INSERT WorkflowHistory
    TX->>Bus: publish(DocumentApproved, payload)
    TX-->>API: Commit
    Bus-->>Audit: consume(DocumentApproved)
    Audit->>DB: INSERT AuditLog (Immutable)
```

## Versioning & Conflict Resolution
Every modification to a document produces a `DocumentVersion` snapshot.

### Version Comparison
The `VersionService` fetches raw JSON snapshots and utilizes textual diffing to highlight `added` and `removed` strings, exposing this data via `/api/v1/documents/:id/compare`.

### Conflict Resolution Flow
Optimistic concurrency is strictly enforced across all state-mutating API routes.

```mermaid
sequenceDiagram
    actor Reviewer A (v4)
    actor Reviewer B (v4)
    participant API as Document API
    participant DB as Database

    Reviewer A->>API: PATCH /documents/1 (version=4)
    API->>DB: Check Version (4 == 4) -> Valid
    API->>DB: UPDATE Document (v5)
    
    Reviewer B->>API: POST /documents/1/submit (version=4)
    API->>DB: Check Version (4 != 5)
    API-->>Reviewer B: 409 Conflict (DOCUMENT_VERSION_CONFLICT)
    Note over Reviewer B, API: UI Prompts Reviewer B to "Reload Latest Version"
```
