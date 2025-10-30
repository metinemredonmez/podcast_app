# Environment Configuration Hierarchy

This document describes how environment variables, Docker configuration, and CI/CD automations are structured across the `podcast_app` monorepo after the 2024-10 refactor.

## Layered Environment Files

| Layer | Path | Purpose |
|-------|------|---------|
| Shared infrastructure | `.env.shared` | Canonical values for Postgres, Redis, JWT secrets, S3, analytics, and admin bootstrap defaults. Loaded for every service. |
| Backend API | `apps/backend/.env.dev` / `.env.prod` | Service-specific overrides (port 3300, CORS origins, Swagger flag, log level, DATABASE_URL/REDIS_URL for container networking). |
| Admin UI | `apps/admin/.env.dev` / `.env.prod` | Vite build/runtime settings (API base URL, mode). |
| Mobile client | `apps/mobile/.env.dev` / `.env.prod` | Expo runtime settings (API base URL, mode). |
| Compose metadata | `infra/docker/.env` | Project-scoped variables (e.g., `COMPOSE_PROJECT_NAME`, timezone) consumed automatically by docker compose. |

`docker-compose.dev.yml` and `docker-compose.prod.yml` now include both `.env.shared` and the appropriate service-level `.env.<env>` file via `env_file`. This ensures containers boot with identical credentials while preserving environment-specific overrides.

## Docker Runtime Expectations

- **Ports** remain fixed: backend 3300, admin 5175, mobile 19005, Postgres 5435, Redis 6390.
- Backend image entrypoint (`apps/backend/docker-entrypoint.sh`) runs:
  1. `yarn prisma:generate`
  2. `yarn prisma:migrate:deploy`
  3. `yarn prisma:db:seed` (only when `NODE_ENV !== production` and `SKIP_DB_SEED` is not `true`)
  4. `yarn start:prod` (via Docker `CMD`)
- Admin and mobile Dockerfiles accept a `BUILD_MODE` arg (`development`/`production`) so dev images execute `yarn build --mode development`, keeping parity with Vite/Expo expectations.
- Compose health checks target service readiness endpoints and wait for Postgres/Redis health before starting dependent services.

## CI/CD Implications

- CI runners should provide `.env.shared` values (either via secrets injection or generating the file during pipeline execution) before building Docker images.
- Backend deploy jobs can rely on the container entrypoint to apply Prisma migrations; no manual `prisma migrate deploy` step is required.
- Set `SKIP_DB_SEED=true` for staging/production workflows where initial seed data should not run automatically.
- `BUILD_MODE` may be overridden in CI when building preview/staging images (e.g., `docker build --build-arg BUILD_MODE=production ...`).
- Ensure Kubernetes/Helm charts or other deployment manifests mount the same variables (`.env.shared` + service-specific env config) so runtime parity matches Compose.

## Local Development Notes

- Update or copy the tracked `.env.dev` / `.env.prod` files when adding new variables; avoid reintroducing `.env.development` / `.env.production`.
- Developers running services outside Docker can create local overrides (e.g., `.env.dev.local`) that shadow the committed defaults while keeping shared secrets under version control.
- Use `SKIP_DB_SEED=true` when running `docker compose up` with an existing Postgres volume to prevent duplicate seed data.
