# Backend Testing & Environment Validation Plan

## 1. Replace Placeholder Unit Specs
- [ ] `apps/backend/test/unit/auth/auth.spec.ts`
  - Add `AuthService` tests covering credential validation, password hashing failures, JWT payload contents, and refresh token rotation.
- [ ] `apps/backend/test/unit/users/users.spec.ts`
  - Cover `UsersService` pagination, unique email enforcement, soft-activation toggles, and password reset flows.
- [ ] `apps/backend/test/unit/podcasts/podcasts.spec.ts`
  - Exercise `PodcastsService` cursor pagination, slug uniqueness, publish scheduling, and repository mapping into DTOs.
- [ ] `apps/backend/test/unit/episodes/episodes.service.spec.ts` *(new file)*
  - Validate episode draft vs publish transitions, audio URL validation, and pagination over tenant data.
- [ ] `apps/backend/test/unit/notifications/notifications.service.spec.ts`
  - Extend coverage to include read-all broadcasting, delete notifications emitting gateway events, and queue payload validation.

## 2. Minimal E2E Skeleton
- Use Nest `TestingModule` bootstrapping `AppModule` with an in-memory Postgres schema or dedicated CI database.
- Seed a test user, then run `supertest` against `/api/auth/login` verifying token issuance and protected route access.
- Call `/api/health/readiness` asserting HTTP 200 with expected dependency keys; ensure teardown closes Prisma connections.

## 3. Environment Validation Enhancements
Update `apps/backend/src/config/env.validation.ts` so:
- `KAFKA_BROKER` is optional with default `"localhost:9092"`.
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_BUCKET` remain optional with safe defaults (already applied).
- `ELASTICSEARCH_NODE` stays optional, allowing graceful Prisma fallback when absent.
