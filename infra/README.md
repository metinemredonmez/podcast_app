# 🧱 Infrastructure

Container orchestration, local Compose stacks, and production runtime assets.

## Docker Compose Suites

- `infra/docker/docker-compose.dev.yml` – full development stack with hot reload and seeded data.
- `infra/docker/docker-compose.prod.yml` – production-like stack (still binding localhost ports for convenience).

## Environment Hierarchy

- `.env.shared` (repo root) – shared secrets/URLs consumed by every service.
- `infra/docker/.env` – project metadata (e.g., `COMPOSE_PROJECT_NAME`).
- `apps/*/.env.dev` / `.env.prod` – per-service overrides automatically mounted via `env_file`.

## Default Ports

| Service  | Host → Container | Notes                     |
|----------|------------------|---------------------------|
| backend  | 3300 → 3300      | NestJS API                |
| admin    | 5175 → 5175      | Vite preview server       |
| mobile   | 19005 → 19005    | Expo dev server           |
| postgres | 5435 → 5432      | PostgreSQL 15             |
| redis    | 6390 → 6379      | Redis 7                   |

## Usage

```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up --build -d
```

Set `SKIP_DB_SEED=true` if you want to skip backend seed scripts when reusing an existing database volume.
