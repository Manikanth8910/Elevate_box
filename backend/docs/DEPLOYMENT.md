# Deployment Guide

The platform is designed to be containerized and easily deployed to cloud environments.

## Docker Compose (Production/Staging)
We provide a `docker-compose.yml` to spin up the API and the PostgreSQL database.

```bash
# 1. Copy Environment
cp backend/.env.example .env

# 2. Start Services
docker-compose up -d --build

# 3. Apply Migrations inside the running API container
docker-compose exec api npx prisma migrate deploy
```

## Environment Variables
Always provide:
- `DATABASE_URL`
- `JWT_SECRET` (Use a strong 256-bit cryptographically secure key in production)
- `NODE_ENV=production`

## Health Checks
Orchestrators (Kubernetes/ECS) should monitor:
- `/api/v1/health` (Application pulse)
- `/api/v1/health/database` (Database connection status)
