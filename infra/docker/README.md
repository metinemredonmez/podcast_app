# Docker Orchestration

This directory contains the Docker tooling that wires the monorepo workspaces together.

## Files

- `docker-compose.dev.yml` – development stack with hot-reload friendly services.
- `docker-compose.prod.yml` – production-oriented stack definitions.
- `.env.shared` – shared environment values consumed by all services (never store secrets here).

## Usage

```bash
# from repository root
yarn install

cd infra/docker
docker-compose -f docker-compose.dev.yml up --build -d
```

Check container status with `docker ps`. The backend listens on `3000`, the admin UI on `5173`, and the mobile Expo server on `19000`. Shut everything down with:

```bash
docker-compose -f docker-compose.dev.yml down --remove-orphans
```

For production, adapt environment files and use `docker-compose.prod.yml`.
