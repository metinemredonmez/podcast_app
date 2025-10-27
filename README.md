# Podcast App Monorepo

Production-ready monorepo for the Podcast App platform. The repository uses **Yarn Workspaces**, **TurboRepo**, and a fully TypeScript-based stack spanning a NestJS backend, Vite-powered admin panel, and React Native mobile client. Shared utility and type packages provide cross-project consistency, while infrastructure and documentation live alongside application code.

## Repository Structure

```
.
├─ apps/
│  ├─ backend/      # NestJS API
│  ├─ admin/        # React + Vite admin panel
│  └─ mobile/       # React Native mobile client
├─ packages/
│  ├─ api-client/   # Shared axios client
│  ├─ shared-types/ # Cross-app TypeScript models/enums
│  └─ shared-utils/ # Shared utility helpers
├─ infra/           # Docker, Kubernetes, Helm, Terraform, scripts
├─ docs/            # API, architecture, deployment, and guide docs
├─ .github/         # CI/CD workflows
└─ README.md
```

Each workspace ships with strict TypeScript configs, ESLint + Prettier, environment examples, Dockerfiles, and lightweight boilerplate ready for feature implementation.

## Installation & Usage

```bash
# Clone repo
git clone <repo-url>
cd podcast_app

# Install all dependencies
yarn install

# Development
yarn dev                    # Tüm servisleri başlat
yarn backend:dev            # Sadece backend
yarn admin:dev              # Sadece admin
yarn mobile:dev             # Sadece mobile

# Build
yarn build                  # Tümünü build et

# Test
yarn test                   # Tüm testleri çalıştır

# Lint
yarn lint                   # Tümünü lint et

# Format
yarn format                 # Tümünü formatla
```

## Key Features

- **NestJS backend** with modular domain architecture, WebSocket gateways, metrics/logging middleware, BullMQ jobs, and TypeORM migrations/seeds.
- **Admin panel** assembled with React, Vite, Redux Toolkit, and shared component/form libraries.
- **React Native mobile app** featuring navigation stacks, RTK Query slices, shared services, and theming utilities.
- **Shared packages** for types, utilities, and HTTP clients to keep contracts aligned across apps.
- **Infrastructure tooling** covering Docker, Kubernetes, Helm charts, Terraform modules, and operational scripts.
- **Documentation & CI/CD** scaffolding to streamline onboarding, deployment, and maintenance.

Dive into the individual workspace READMEs and documentation directories for detailed implementation notes and next steps.

## Docker Compose

The monorepo ships with per-app Dockerfiles (`apps/backend`, `apps/admin`, `apps/mobile`) and shared compose files under `infra/docker`.

```bash
cd infra/docker
# development
docker-compose -f docker-compose.dev.yml up --build -d

# production-style
docker-compose -f docker-compose.prod.yml up --build -d
```

The compose stack expects environment values defined in each app's `.env.*` files plus `infra/docker/.env.shared`. Postgres and Redis containers are included for local development.

