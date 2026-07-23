# Role-Based Access Control (RBAC) & Policy Engine

## Abstract
The system strictly enforces permissions on the server using an abstracted **Policy Engine**. We do not hardcode `if (role === 'Admin')` inside controllers.

## Core Concepts
- **Roles**: `Viewer`, `Author`, `Reviewer`, `Admin`.
- **Permissions**: Granular actions like `CREATE_DRAFT`, `APPROVE_DOC`, `VIEW_USERS`.
- **Role Permissions Mapping**: Defines which permissions each role possesses natively.
- **Resource Ownership**: Determines dynamic permissions based on context.

## How it works
1. **AuthZ Middleware**: `authorize(Permission.EDIT_OWN_DRAFT)` wraps a route.
2. **Policy Evaluator**:
   ```typescript
   policyEngine.can(user, Permission.EDIT_OWN_DRAFT, resourceContext)
   ```
3. **Validation**: The engine first checks if the `user.role` is mapped to `EDIT_OWN_DRAFT`. If yes, and if `resourceContext` is provided, it verifies ownership rules (e.g., ensuring `resource.ownerId === user.id`).

## Frontend Integration
The frontend `AuthContext` provides a lightweight `hasPermission()` hook. This is used by `RoleGuard` components to conditionally render UI components (like the Dashboard blocks) or protect routes from unauthorized client-side navigation.
