## Database migrations and seeding

## Health endpoints

- GET `/api/health/liveness`: basic process health
- GET `/api/health/readiness`: database and redis readiness checks

Kubernetes probes are configured to use these paths. Adjust probe timings in Helm values under `backend.probes`.

- Development:

```bash
yarn workspace @podcast-app/backend prisma:migrate:dev
yarn workspace @podcast-app/backend prisma db seed
```

- Production (Kubernetes):
  - Init container runs `prisma migrate deploy` before app starts.
  - A one-off Job `backend-migrate` is provided in Helm.

