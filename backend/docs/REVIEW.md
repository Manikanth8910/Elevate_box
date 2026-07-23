# Review System Architecture

The Review System is the core module for approving, rejecting, and publishing documents. It uses optimistic concurrency control to prevent conflicting reviews.

## Concurrency Control
When a reviewer opens a document, they view a specific `version` (e.g., v4). 
If another reviewer approves the document, the DB increments the version to v5.
If the first reviewer tries to reject, they send `version: 4`. The `ReviewService` checks if `currentVersion === incomingVersion`. If false, it throws a `409 Conflict`. The UI catches this and prompts the user to reload.

## Sequence Diagrams

### Approve Document
```mermaid
sequenceDiagram
    actor Reviewer
    participant API as ReviewController
    participant Service as ReviewService
    participant Engine as Workflow Engine
    participant TX as TransactionManager
    participant DB as Database
    participant Event as Event Bus
    participant Analytics as AnalyticsConsumer

    Reviewer->>API: POST /documents/:id/approve (version)
    API->>Service: approveDocument(user, id, version)
    Service->>DB: SELECT Document
    Service->>Service: Check Version (Optimistic Lock)
    Service->>Engine: validate(SUBMITTED -> APPROVED)
    Engine-->>Service: Valid
    Service->>TX: execute()
    TX->>DB: UPDATE Document (Status=APPROVED, version+1)
    TX->>DB: INSERT WorkflowHistory
    TX->>DB: INSERT ActivityFeed
    TX->>Event: publish(DocumentApproved)
    TX-->>Service: Commit
    Event-->>Analytics: consume(DocumentApproved)
    Analytics->>DB: INSERT AnalyticsSnapshot (Metric)
    Service-->>API: Success
    API-->>Reviewer: 200 OK
```

### Reject Document
```mermaid
sequenceDiagram
    actor Reviewer
    participant API as ReviewController
    participant Service as ReviewService
    participant TX as TransactionManager
    participant DB as Database

    Reviewer->>API: POST /documents/:id/reject (version, comment)
    API->>Service: rejectDocument(user, id, version, comment)
    Service->>DB: SELECT Document
    Service->>Service: Check Version (409 Conflict check)
    Service->>TX: execute()
    TX->>DB: UPDATE Document (Status=REJECTED, version+1)
    TX->>DB: INSERT Comment (severity=BLOCKER)
    TX->>DB: INSERT WorkflowHistory
    TX-->>Service: Commit
    Service-->>API: Success
    API-->>Reviewer: 200 OK
```
