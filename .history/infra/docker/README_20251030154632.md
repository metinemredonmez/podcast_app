# Podcast App - Docker Development Environment

## Quick Start
```bash
# From repository root
yarn install
yarn prisma generate

# Start development stack
cd infra/docker
docker-compose -f docker-compose.dev.yml up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## Service URLs

### Development
- Backend API: http://localhost:3300/api
- Swagger Docs: http://localhost:3300/api/docs
- Health Check: http://localhost:3300/api/health/readiness
- Admin Panel: http://localhost:5175
- Mobile (Expo): http://localhost:19005
- MinIO Console: http://localhost:9101
- PostgreSQL: localhost:5435 (user: postgres, pass: postgres, db: podcast_app)
- Redis: localhost:6390

### Production
- Backend API: http://localhost:8090/api
- Admin Panel: http://localhost:8081
- Mobile (Expo): http://localhost:8091
- PostgreSQL: Internal only (no host port)
- Redis: Internal only (no host port)

## Default Credentials

- **Admin Email**: admin@podcast.dev
- **Admin Password**: changeme
- **PostgreSQL User**: postgres
- **PostgreSQL Password**: postgres (dev), ${POSTGRES_PASSWORD} (prod)
- **MinIO**: minioadmin / minioadmin

## Port Mappings (Verified Conflict-Free)

### Development
- 3300 → Backend API
- 5175 → Admin Panel
- 19005 → Mobile Expo
- 5435 → PostgreSQL (container: 5432)
- 6390 → Redis (container: 6379)
- 9100 → MinIO API
- 9101 → MinIO Console
- 9210 → Elasticsearch (optional)

### Production
- 8090 → Backend API (changed from 8080 to avoid conflicts)
- 8081 → Admin Panel
- 8091 → Mobile Expo (changed from 8082 to avoid conflicts)

**Note**: These ports are specifically chosen to avoid conflicts with Synchron AI Hub and other projects.

## Troubleshooting

### Port Conflicts

If you see "port already allocated" errors:

1. Check running containers:
```bash
docker ps -a
```

2. Verify no other projects use these ports:
```bash
lsof -i :3300
lsof -i :5435
```

3. Our ports are specifically chosen to avoid Synchron AI Hub conflicts

### Database Connection

If backend can't connect to database:

1. Check postgres health:
```bash
docker-compose ps postgres
```

2. Verify DATABASE_URL in .env.development

3. Check logs:
```bash
docker-compose logs postgres
```

4. Test connection manually:
```bash
psql -h localhost -p 5435 -U postgres -d podcast_app
```

### Prisma Errors

After schema changes:
```bash
yarn prisma generate
yarn prisma migrate dev --name your_migration_name
docker-compose restart backend
```

### Container Build Fails

Clear Docker cache and rebuild:
```bash
docker-compose down -v
docker system prune -af
docker-compose -f docker-compose.dev.yml up --build
```

## Development Workflow

### Database Migrations

Create and apply a new migration:
```bash
# Create migration
yarn workspace @podcast-app/backend prisma migrate dev --name add_new_feature

# Apply to Docker containers
docker-compose restart backend
```

### Seed Database
```bash
docker-compose exec backend yarn prisma db seed
```

### Reset Database

Complete database reset (WARNING: This deletes all data):
```bash
# Stop all services and remove volumes
docker-compose down -v

# Start only postgres
docker-compose up -d postgres

# Wait for postgres to be ready, then run migrations and seed
docker-compose exec backend yarn prisma migrate deploy
docker-compose exec backend yarn prisma db seed
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuild Single Service
```bash
docker-compose up -d --build backend
```

## Additional Services

### MinIO (S3-compatible storage)

Access the MinIO console at http://localhost:9101

Default credentials: minioadmin / minioadmin

### Elasticsearch (Optional)

Uncomment the elasticsearch service in docker-compose.dev.yml to enable.

Access at: http://localhost:9210

## Production Deployment

For production:

1. Set environment variables in .env.production
2. Use docker-compose.prod.yml:
```bash
POSTGRES_PASSWORD=secure_password docker-compose -f docker-compose.prod.yml up -d
```
