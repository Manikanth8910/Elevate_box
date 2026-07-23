# Document Approval Workflow Engine

The Workflow Engine strictly enforces transition rules, ensuring that business logic is completely isolated from controllers and standard services. 

## State Machine
Valid transition paths:

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Document
    DRAFT --> SUBMITTED : Submit
    DRAFT --> ARCHIVED : Archive
    SUBMITTED --> APPROVED : Approve
    SUBMITTED --> REJECTED : Reject
    SUBMITTED --> ARCHIVED : Archive
    REJECTED --> DRAFT : Reopen
    APPROVED --> PUBLISHED : Publish
    APPROVED --> ARCHIVED : Archive
    PUBLISHED --> ARCHIVED : Archive
    ARCHIVED --> [*]
```

## Sequence Diagrams

### Create & Edit Draft
```mermaid
sequenceDiagram
    actor Author
    participant API as API Controller
    participant Engine as Workflow Engine
    participant TX as Transaction Manager
    participant DB as Database
    participant Event as Event Bus

    Author->>API: POST /documents (title, body)
    API->>Engine: Validate Transition (* -> DRAFT)
    Engine-->>API: Valid
    API->>TX: execute()
    TX->>DB: INSERT Document
    TX->>DB: INSERT DocumentVersion
    TX->>DB: INSERT WorkflowHistory
    TX->>Event: publish(DocumentCreated)
    TX-->>API: Commit
    API-->>Author: 201 Created
```

### Submit Document
```mermaid
sequenceDiagram
    actor Author
    participant API as API Controller
    participant Engine as Workflow Engine
    participant TX as Transaction Manager
    participant DB as Database
    participant Event as Event Bus

    Author->>API: POST /documents/:id/submit
    API->>Engine: validate(DRAFT -> SUBMITTED)
    Engine-->>API: Valid (Role=Author, Owner=True)
    API->>TX: execute()
    TX->>DB: UPDATE Document (Status=SUBMITTED)
    TX->>DB: INSERT WorkflowHistory
    TX->>Event: publish(DocumentSubmitted)
    TX-->>API: Commit
    API-->>Author: 200 OK
```
