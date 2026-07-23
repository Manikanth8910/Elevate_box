# 1. Monorepo and Clean Architecture

Date: 2026-07-21

## Status
Accepted

## Context
We need to build a complex Document Approval System. Scattering logic makes it unmaintainable.

## Decision
We will use a Monorepo containing `backend`, `frontend`, and `shared`.
The backend uses layered Clean Architecture. The frontend uses a feature-based structure.
Logic for workflows, audit, and RBAC are abstracted into standalone engine modules.
