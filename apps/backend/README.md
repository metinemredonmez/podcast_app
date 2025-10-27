# 🧠 Backend (NestJS + Prisma + PostgreSQL)

## 🔧 Setup

```bash
cd apps/backend
yarn install
yarn prisma generate
yarn prisma migrate dev
yarn start:dev
```

### ⚙️ Env Variables

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/podcast_app
PORT=3000
JWT_SECRET=supersecretkey
```

## 🗂️ Modules
- AuthModule
- UsersModule
- PodcastsModule
- EpisodesModule

## 🧩 Infra
- Prisma ORM (`apps/backend/prisma`)
- Redis (Cache)
- BullMQ (Background jobs)
- WebSocket Gateway (notifications)
