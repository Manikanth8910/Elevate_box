# CI/CD Pipeline

The `.github/workflows/ci.yml` file dictates the pipeline architecture.

## 1. lint-and-typecheck
- Installs dependencies for Backend & Frontend.
- Generates Prisma client.
- Runs strict `tsc --noEmit` to ensure zero typescript errors exist before proceeding.

## 2. test
- Spins up a `postgres:15` service container.
- Applies Prisma migrations to the ephemeral test database.
- Runs `npm run test` executing Vitest across the backend.
- Uploads the coverage artifact.

## 3. build
- Validates that both the Node.js backend and React frontend can be successfully bundled for production (`npm run build`).

> [!CAUTION]
> The `main` branch is protected. All code must pass this CI pipeline before merging.
