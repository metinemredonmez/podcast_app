# 🐳 Docker Setup Guide

## Quick Start

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data!)
docker-compose down -v
```

### Production

```bash
# Build and start
docker-compose up -d --build

# Scale backend
docker-compose up -d --scale backend=3
```

---

## Services

### Backend API
- **Port**: 3300
- **Health**: http://localhost:3300/health
- **API Docs**: http://localhost:3300/api/docs
- **Metrics**: http://localhost:3300/metrics

### PostgreSQL
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: podcast_app

### Redis
- **Port**: 6379
- **Password**: (none)

### MinIO (S3)
- **API**: http://localhost:9000
- **Console**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin

### Prometheus
- **Port**: 9090
- **URL**: http://localhost:9090

### Grafana
- **Port**: 3000
- **URL**: http://localhost:3000
- **Username**: admin
- **Password**: admin (change via GRAFANA_PASSWORD env)

---

## Environment Variables

Create a `.env` file in the root directory:

```bash
# JWT Secrets (REQUIRED for production)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Admin Password
ADMIN_PASSWORD=secure-admin-password

# Email (Optional - Resend API)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Sentry Error Tracking (Optional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Grafana
GRAFANA_PASSWORD=strong-grafana-password
```

---

## Database Management

### Migrations

```bash
# Run migrations
docker-compose exec backend yarn prisma:migrate:deploy

# Generate Prisma client
docker-compose exec backend yarn prisma:generate

# Create new migration
docker-compose exec backend yarn prisma:migrate:dev --name migration_name

# Seed database
docker-compose exec backend yarn prisma:db:seed
```

### Direct Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d podcast_app

# Prisma Studio (Database GUI)
docker-compose exec backend yarn prisma:studio
```

---

## Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Log Files

Backend logs are persisted in `./apps/backend/logs/`:
- `error.log` - Error logs only
- `combined.log` - All logs

---

## Monitoring

### Prometheus Metrics

1. Open http://localhost:9090
2. Query examples:
   - `http_requests_total` - Total HTTP requests
   - `http_request_duration_seconds` - Request duration
   - `rate(http_requests_total[5m])` - Request rate (5min)

### Grafana Dashboards

1. Open http://localhost:3000
2. Login (admin/admin)
3. Create dashboards with Prometheus data source

**Useful Queries**:
```promql
# Request rate
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Active users
active_users_total
```

---

## Backup & Restore

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres podcast_app > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres podcast_app < backup.sql
```

### Volume Backup

```bash
# Backup all volumes
docker run --rm \
  -v podcast_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Rebuild
docker-compose up -d --build backend
```

### Database connection errors

```bash
# Check PostgreSQL health
docker-compose ps postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

### Redis connection errors

```bash
# Check Redis health
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Port already in use

```bash
# Find process using port
lsof -i :3300

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Clean slate restart

```bash
# Stop all containers
docker-compose down

# Remove all volumes (⚠️ DELETES ALL DATA)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

---

## Performance Tips

### Resource Limits

Add to docker-compose.yml services:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Production Optimizations

1. **Use production Dockerfile**:
   ```yaml
   backend:
     build:
       dockerfile: apps/backend/Dockerfile.prod
   ```

2. **Enable log rotation**:
   ```yaml
   backend:
     logging:
       driver: "json-file"
       options:
         max-size: "10m"
         max-file: "3"
   ```

3. **Use external databases** (don't run DB in Docker in production)

---

## Security

### Production Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Configure CORS for production domains
- [ ] Set NODE_ENV=production
- [ ] Enable Sentry error tracking
- [ ] Regular database backups
- [ ] Update Docker images regularly
- [ ] Use Docker secrets for sensitive data
- [ ] Implement rate limiting
- [ ] Enable firewall rules

---

## Useful Commands

```bash
# Enter backend container shell
docker-compose exec backend sh

# Run tests
docker-compose exec backend yarn test

# Check resource usage
docker stats

# Prune unused Docker resources
docker system prune -a

# Update all images
docker-compose pull

# View container processes
docker-compose top
```

---

## Architecture

```
┌─────────────────┐
│   Grafana       │  Port 3000
│   (Monitoring)  │
└────────┬────────┘
         │
┌────────┴────────┐
│  Prometheus     │  Port 9090
│  (Metrics)      │
└────────┬────────┘
         │
┌────────┴────────┐
│   Backend API   │  Port 3300
│   (NestJS)      │
└─┬─┬─┬──────────┘
  │ │ │
  │ │ └────────────────┐
  │ │                  │
  │ │         ┌────────┴────────┐
  │ │         │     MinIO       │  Port 9000/9001
  │ │         │  (S3 Storage)   │
  │ │         └─────────────────┘
  │ │
  │ └──────────┐
  │            │
┌─┴────────┐ ┌─┴────────┐
│PostgreSQL│ │  Redis   │
│Port 5432 │ │Port 6379 │
└──────────┘ └──────────┘
```

---

For more information, see the main README.md
