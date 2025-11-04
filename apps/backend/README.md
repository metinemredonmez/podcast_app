# 🧠 Backend (NestJS + Prisma + PostgreSQL)

NestJS service powering the podcast platform APIs, WebSockets, jobs, and integrations.

## 🔧 Local Development

Run Docker only for infrastructure dependencies (Postgres `5435`, Redis `6390`, Kafka `9092`).

```bash
cd infra/docker && docker-compose -f docker-compose.dev.yml up -d
yarn workspace @podcast-app/backend start:dev
```

### Environment Hierarchy

- `.env.shared` (repository root) – shared credentials for Postgres, Redis, JWT, S3, etc.
- `apps/backend/.env.dev` – development overrides (port `3300`, logging, Swagger toggle).
- `apps/backend/.env.prod` – production defaults for containerized runs.

> Tenant CRUD and provisioning endpoints are exposed via the **Admin** module. The legacy `TenantsModule` has been removed; use the admin APIs for tenant management.

`ConfigModule.forRoot` automatically selects `.env.dev` unless `NODE_ENV=production`, so avoid referencing legacy `.env.development` files. When running via Docker, Compose injects `.env.shared` plus the matching `.env.<env>` file.

### Database Tooling

- Generate client: `yarn prisma:generate`
- Run migrations locally: `yarn prisma:migrate:dev`
- Apply migrations in containers: handled by `docker-entrypoint.sh` (`prisma:migrate:deploy`)
- Seed data (non-production only): `yarn prisma:db:seed` or via container entrypoint (skip with `SKIP_DB_SEED=true`)

## 🧩 Stack Highlights

- Prisma ORM (`apps/backend/prisma`)
- Redis + BullMQ for queues
- MinIO/S3 storage abstraction
- ElasticSearch-based search module
- Throttled WebSocket gateways for live streaming and notifications

Health endpoints: `/api/health/readiness`, `/api/health/liveness`
