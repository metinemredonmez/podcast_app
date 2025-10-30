## Prisma (Database)

Set DATABASE_URL in your environment:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/podcast_app?schema=public"
```

Generate client, create migrations, and seed:

```bash
yarn workspace @podcast-app/backend prisma:generate
yarn workspace @podcast-app/backend prisma:migrate:dev
yarn workspace @podcast-app/backend prisma db seed
```

## Kubernetes secrets (production)

Create the Secret with a base64-encoded `DATABASE_URL`:

```bash
DB_URL="postgresql://user:pass@host:5432/podcast_app?schema=public"
DB_URL_B64=$(echo -n "$DB_URL" | base64)
kubectl apply -f infra/k8s/base/secrets/database-secret.yaml
# Or via Helm values
helm upgrade --install podcast-app infra/helm/podcast-app \
  --set backend.databaseUrlB64="$DB_URL_B64"
```

