## Probes and Secrets

### Probes

The backend exposes health endpoints:

- `/api/health/liveness`
- `/api/health/readiness`

Configure probe timings via Helm values `backend.probes.*`.

### Secrets

`DATABASE_URL` is provided via Kubernetes Secret.

Raw manifest example: `infra/k8s/base/secrets/database-secret.yaml`.

Helm: set `backend.databaseUrlB64` to a base64-encoded value or bring your own Secret named by `backend.databaseSecretRef`.

## Connection Pooling (recommended)

Use PgBouncer in transaction mode for Prisma in production.

- Sample DATABASE_URL (PgBouncer service):

```bash
postgresql://USER:PASS@pgbouncer:6432/podcast_app?schema=public&pgbouncer=true&connection_limit=20&pool_timeout=30
```

- Notes:
  - `pgbouncer=true` optimizes Prisma for PgBouncer.
  - `connection_limit` sets Prisma pool size per pod.
  - `pool_timeout` seconds to wait for a connection.

Provide this URL via Secret (base64-encoded) using `backend.databaseUrlB64`.


