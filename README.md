# Enterprise Document Approval Workflow System

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Architecture](https://img.shields.io/badge/Architecture-Event%20Driven-blue)
![Language](https://img.shields.io/badge/Language-TypeScript-blue)

A production-grade, highly scalable SaaS platform for managing document approval workflows. Built to demonstrate enterprise software engineering principles including Clean Architecture, SOLID, and Event-Driven Design.

## 🌟 Key Features

- **Robust State Machine**: Strict, deterministic transitions (`Draft → Submitted → Under Review → Approved → Published`).
- **ABAC/RBAC Policy Engine**: Granular permissions preventing unauthorized actions at the core domain layer.
- **Optimistic Concurrency**: Prevents race conditions during document edits and approvals using strict version checking.
- **Immutable Audit Trail**: Event-driven architecture guarantees that every action creates an unalterable log.
- **Production Observability**: Integrated Winston JSON logging, request tracing (`x-request-id`), and Datadog-ready metrics.
- **Enterprise Security**: Helmet, Express Rate Limiting, standard `CustomError` masking, and defense-in-depth routing.

## 👥 Roles and Permissions

The system features a strict Role-Based Access Control (RBAC) model defining exactly what each user can perform:

- **VIEWER**: Basic access. Can view published documents and their own profile.
- **AUTHOR**: Content creator. Can create drafts, edit their own drafts, submit them for review, reopen rejected drafts, and view their own document history.
- **REVIEWER**: Content approver. Has access to the review queue, can approve or reject documents, publish approved documents, and view the complete audit history of any document.
- **ADMIN**: System administrator. Has full overarching abilities including viewing all documents (in any state), publishing, archiving any document, managing users, accessing audit logs, and managing the overall system.

## 🛠️ Technology Stack

| Category         | Technology                       |
|------------------|----------------------------------|
| **Core**         | Node.js 20, Express, TypeScript  |
| **Database**     | PostgreSQL 15, Prisma ORM        |
| **Security**     | Helmet, bcrypt, JSON Web Tokens  |
| **Architecture** | Event-Bus, Clean Architecture    |
| **DevOps**       | Docker, GitHub Actions           |

## 📦 Project Structure

```text
.
├── backend/                  # Express REST API
│   ├── src/                  
│   │   ├── auth/             # Authentication & JWT Issuance
│   │   ├── events/           # Event Bus & Consumers
│   │   ├── middleware/       # RBAC, Rate Limiting, Error Handling
│   │   ├── policy/           # Granular ABAC Policy Engine
│   │   ├── repositories/     # Database Access Layer
│   │   ├── services/         # Core Business Logic
│   │   └── workflow/         # Deterministic State Machine
│   ├── prisma/               # Database Schema & Migrations
│   ├── tests/                # Unit, Integration, & E2E Suites
│   ├── shared/               # Shared Types and Schemas
│   └── docker-compose.yml    # Orchestration
├── frontend/                 # React/Vite Client
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Local Deployment

The application is split into two independent parts: `frontend` and `backend`.

#### 1. Start the Backend

```bash
# Navigate to backend
cd backend

# Initialize environment variables
cp .env.example .env

# Spin up Postgres and the API
docker-compose up -d --build

# Run database migrations (Wait until the DB is fully ready)
docker-compose exec api npx prisma migrate deploy
```

#### 2. Start the Frontend

In a new terminal window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (links to local shared module automatically)
npm install

# Start the development server
npm run dev
```

The frontend will be accessible at `http://localhost:5173` (or the port specified by Vite) and the backend API runs at `http://localhost:3000`.

## 📘 Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Posture](./docs/SECURITY.md)
- [CI/CD Pipeline](./docs/CI_CD.md)
- [API Reference (OpenAPI)](./docs/openapi.yaml)
- [Portfolio Presentation](./docs/PORTFOLIO_PRESENTATION.md)

## 🤝 Principles Applied

- **Separation of Concerns**: Controllers only handle HTTP. Services orchestrate logic. Repositories handle data.
- **DRY**: Shared validation logic and error handling middlewares.
- **Fail-Fast**: The Policy Engine and State Machine throw errors *before* database transactions begin.
- **Secure by Default**: Stack traces are stripped, IP requests are rate-limited, and database parameters are sanitized via Prisma.
