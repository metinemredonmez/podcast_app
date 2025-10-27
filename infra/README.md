# 🧱 Infrastructure

### Docker Compose
- `docker-compose.dev.yml` → Development stack
- `docker-compose.prod.yml` → Production stack

### Services
| Service  | Port | Description   |
|----------|------|---------------|
| backend  | 3000 | NestJS API    |
| admin    | 5173 | React Admin   |
| mobile   | 19000| Expo Dev      |
| postgres | 5432 | Database      |
| redis    | 6379 | Cache         |

### Usage
```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up -d
```
