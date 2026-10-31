# AuthCore (v1.1.0)

A high-performance centralized authentication, authorization, and multi-tenant organization management platform built with Node.js, Express, TypeScript, MongoDB, and AWS SQS.

## Features
- **Multi-Tenant Organization Management**: Organizations, memberships, invitations, and hierarchical RBAC roles.
- **Granular RBAC Authorization**: Action-level permission middleware (`org:*`, `members:*`, `roles:*`, `api_keys:*`, `audit:*`).
- **Cryptographic Security**: RSA JWT access tokens, Argon2 password hashing, SHA-256 token families, and HMAC API keys.
- **Atomic Refresh Token Rotation**: Optimistic concurrency with automated token reuse breach detection and family revocation.
- **Audit Logging**: Asynchronous audit logging of authentication and organization security events.
- **Rate Limiting**: Sliding-window rate limiters protecting against brute-force and abuse.
- **Asynchronous Email Worker**: SQS-driven worker for verification, invitations, and password recovery.
- **Health & Readiness Probes**: Kubernetes-ready `/health/live` and `/health/ready` endpoints.

## Workspace Architecture
```
├── apps/
│   ├── auth-api       # Main Express REST API with RBAC & Audit Logging
│   └── worker         # AWS SQS email consumption worker
└── packages/
    ├── config         # Environment validation and duration parsing
    ├── contracts      # Shared Zod schemas, types, and permissions
    ├── database       # MongoDB client, models, and repository interfaces
    ├── logger         # Structured Pino logging with context tracking
    └── queue          # AWS SQS publisher & queue abstractions
```
