## Prisma usage guide

Common patterns:

```ts
// Selecting only needed fields
await prisma.user.findMany({
  select: { id: true, email: true, name: true },
  take: 50,
});

// Including relations and limiting nested results
await prisma.podcast.findUnique({
  where: { id },
  include: {
    user: { select: { id: true, email: true } },
    episodes: { select: { id: true, title: true }, orderBy: { publishedAt: 'desc' }, take: 10 },
  },
});

// Cursor-based pagination example
await prisma.episode.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastSeenId },
  orderBy: { publishedAt: 'desc' },
});
```

## Connection Pooling

- Local dev (no PgBouncer): default Prisma pool is fine.
- Production: prefer PgBouncer and tune parameters via URL:

```bash
# Example (encode this for Helm Secret)
export DATABASE_URL="postgresql://USER:PASS@pgbouncer:6432/podcast_app?schema=public&pgbouncer=true&connection_limit=20&pool_timeout=30"
```

