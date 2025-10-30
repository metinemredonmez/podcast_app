# Podcast App Monorepo

## 1. Overview
Podcast App is a full-stack platform for creating, managing, and streaming podcast content. The monorepo bundles:

- **Backend** – NestJS API powered by Prisma ORM, PostgreSQL, Redis, BullMQ, and WebSockets.
- **Admin** – Vite + React dashboard for editorial workflows, tenant management, and analytics.
- **Mobile** – Expo/React Native client for listeners with offline downloads and live streaming.
- **Infrastructure** – Docker, Kubernetes/Helm, Terraform modules, and GitHub Actions pipelines.

Shared TypeScript packages deliver consistent types, utilities, and API clients across all apps.

## 2. Project Structure

```
podcast_app/
 ├─ apps/
 │  ├─ backend/   → NestJS + Prisma API
 │  ├─ admin/     → Vite React admin panel
 │  └─ mobile/    → React Native (Expo) client
 ├─ packages/     → Shared types, utils, API client
 ├─ infra/        → Docker, Kubernetes, Helm, Terraform
 ├─ .github/      → GitHub Actions workflows
└─ README.md
```
## 3. Environment Setup

### Prerequisites
- Node.js 20+
- Yarn 1.22+
- Docker & Docker Compose
- Optional: NVM, Expo CLI, kubectl, helm

### Install Dependencies
```bash
git clone <repo>
cd podcast_app
yarn install --frozen-lockfile
yarn workspace @podcast-app/backend prisma:generate
```
### Environment Files
The stack uses a layered configuration model:

- `.env.shared` – global infrastructure defaults (Postgres, Redis, JWT, S3, analytics).
- `apps/backend/.env.dev` / `.env.prod` – API-specific overrides (ports, logging, CORS).
- `apps/admin/.env.dev` / `.env.prod` – Vite client configuration (API endpoint, mode).
- `apps/mobile/.env.dev` / `.env.prod` – Expo client configuration (API endpoint, mode).
- `infra/docker/.env` – Docker Compose project metadata (project name, timezone).

Docker Compose loads `.env.shared` plus the matching `apps/*/.env.<env>` file for each service. Copy the `.env.example` files and adjust secrets before running locally or deploying.

For a deeper dive into inheritance rules and CI/CD expectations, see `docs/guides/environment-hierarchy.md`.

## 4. Running Locally

1. Boot the infrastructure services (Postgres, Redis, Kafka, MinIO):
   ```bash
   cd infra/docker
   docker-compose -f docker-compose.dev.yml up --build -d
   ```
2. From the repo root, start the applications locally:
   ```bash
   yarn dev
   ```

Service port map:

| Service  | Port |
|----------|------|
| Backend  | 3300 |
| Admin    | 5175 |
| Mobile   | 19005 |
| Postgres | 5435 |
| Redis    | 6390 |
| Kafka    | 9092 |

Stop the infra stack when you are done:
```bash
docker-compose -f infra/docker/docker-compose.dev.yml down
```
## 5. Testing & Linting

```bash
yarn workspace @podcast-app/backend test --passWithNoTests
yarn workspace @podcast-app/admin test --passWithNoTests
yarn workspace @podcast-app/mobile test --passWithNoTests

yarn lint
```
## 6. CI/CD Workflows

GitHub Actions definitions live in `.github/workflows/`:

- **backend.yml** – Build/test backend, run Prisma migrations against CI Postgres, publish Docker image to GHCR, deploy to Kubernetes.
- **admin.yml** – Build/test admin app, push Docker image, sync build artifacts to S3 (or CDN).
- **mobile.yml** – Expo/EAS build pipeline publishing mobile artifacts.
- **deploy.yml** – Manual/tag-triggered Helm rollout with Prisma migration job and post-deploy health check.

Configure repository secrets: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `REGISTRY_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EXPO_TOKEN`, `KUBE_CONFIG`, `HEALTHCHECK_HOST`, etc.

## 7. Deployment

### Docker Images
CI pushes images to GitHub Container Registry: `ghcr.io/<org>/podcast-backend` and `ghcr.io/<org>/podcast-admin`.

### Helm Rollout
```bash
helm upgrade --install podcast-app infra/helm/podcast-app \
  -f infra/helm/podcast-app/values.yaml
```

Ensure Kubernetes secrets contain production-ready environment values before rollout.

### Verification
```bash
kubectl get pods
curl -f https://<domain>/api/health/readiness
```

## 8. Monitoring & Observability
- Health probes: `/api/health/liveness`, `/api/health/readiness`
- Optional Prometheus scraper: `/metrics`
- Logs: Pino/NestJS structured logging (stdout → ELK/Grafana Loki)
- Helm values expose toggles for Grafana dashboards

## 9. Contact & License
- Maintainers: Podcast App Engineering (team@podcast.example)
- Contributions: Submit issues/PRs with linked tickets and follow conventional commits.
- License: [MIT](LICENSE)
