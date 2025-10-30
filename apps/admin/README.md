# Admin Panel

Vite + React dashboard for managing podcast content, tenants, analytics, and platform settings.

## Getting Started

```bash
cd apps/admin
yarn install
yarn dev --port 5175
```

The app expects the backend API at `http://localhost:3300/api`. Override via `VITE_API_BASE_URL`.

## Environment Files

- `.env.shared` (repo root) – shared credentials (JWT, S3, etc.) provided to all apps.
- `apps/admin/.env.dev` – defaults for local development (`VITE_ENV=development`).
- `apps/admin/.env.prod` – production/runtime defaults (`VITE_ENV=production`).

Docker Compose automatically mounts `.env.shared` plus the matching admin env file; do not reintroduce `.env.development` or `.env.production`.

## Docker Notes

The Dockerfile accepts `BUILD_MODE` (`development` or `production`). Compose sets `BUILD_MODE=development` in dev stacks so `yarn build --mode development` aligns with local preview expectations. Runtime uses `yarn preview --host 0.0.0.0 --port 5175`.
