## Prisma steps in CI

1. Install deps and generate Prisma client

```bash
yarn install --frozen-lockfile
yarn workspace @podcast-app/backend prisma:generate
```

2. Apply migrations to CI database

```bash
export DATABASE_URL="$CI_DATABASE_URL"
yarn workspace @podcast-app/backend prisma:migrate:deploy
```

3. Run tests (unit and e2e)

```bash
yarn test
```

## Post-deploy readiness check

An example workflow (`.github/workflows/deploy.yml`) performs a readiness probe:

```bash
curl https://your-api.com/api/health/readiness
```

Configured to retry 3 times with 10s delay; fails deployment if not 200.

