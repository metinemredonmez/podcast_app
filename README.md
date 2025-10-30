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
- `apps/backend/.env.development` / `.env.production` – API, Prisma, Redis, JWT, S3, Elasticsearch, admin bootstrap (dev runs on port 3300).
- `apps/admin/.env.development` / `.env.production` – Admin UI configuration (defaults to http://localhost:3300/api).
- `apps/mobile/.env.development` / `.env.production` – Mobile Expo configuration (defaults to http://localhost:3300/api).
- `infra/docker/.env.shared` – Shared local Docker variables.

Copy `.env.example` files and provide real secrets for production deployments.

## 4. Running Locally

```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up --build -d
```
Access services:
- Backend Swagger – http://localhost:3300/api/docs
- Admin dashboard – http://localhost:5175
- Mobile Expo dev server – http://localhost:19005

Stop the stack:
```bash
docker-compose -f docker-compose.dev.yml down
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
