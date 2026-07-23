# Architecture
## Overview
The Document Approval System uses a Clean Architecture with a strict separation of concerns.

## Layers
1. **Presentation/Routing**: Express Routes.
2. **Controller**: Handles HTTP requests, validates via Zod, and formats responses. No business logic.
3. **Service**: Contains business rules and workflow orchestration.
4. **Repository**: Abstracts database access using Prisma.
5. **Database**: PostgreSQL storing relational data.

## Key Principles
- **DRY & KISS**: Shared types and minimal redundancy.
- **SOLID**: Each component has a single responsibility.
- **Composition over Inheritance**: Services are composed using Dependency Injection.
