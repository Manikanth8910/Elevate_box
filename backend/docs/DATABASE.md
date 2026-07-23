# Database Schema Design
## Entities
- **Users**: Core identities.
- **Documents**: Core approval entity (has `status`, `version`).
- **DocumentVersions**: Content snapshots.
- **Comments**: Reviewer comments.
- **AuditLogs**: Immutable record of changes (Actor, Action, Entity, Metadata).
- **WorkflowHistory**: Specific state transitions.
