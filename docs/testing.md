## Prisma testing strategy

- Unit tests: mock `PrismaService` methods with jest.fn().
- E2E tests: use a dedicated test database; run `resetDb()` and `seedDb()` around tests.
- CI: run `prisma migrate deploy` before e2e tests.

