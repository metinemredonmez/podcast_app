#!/bin/bash

# ===========================================
# PRODUCTION DEPLOYMENT SCRIPT
# ===========================================
# Sunucuda calistirmak icin:
# chmod +x scripts/deploy-prod.sh
# ./scripts/deploy-prod.sh

set -e

echo "========================================"
echo "PODCAST APP - PRODUCTION DEPLOYMENT"
echo "========================================"

# Renk kodlari
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Root dizinine git
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo -e "${YELLOW}Root dizin: $ROOT_DIR${NC}"

# .env.prod kontrolu
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}HATA: .env.prod dosyasi bulunamadi!${NC}"
    echo "Lutfen .env.prod.example dosyasini kopyalayip doldurun:"
    echo "  cp .env.prod.example .env.prod"
    exit 1
fi

# .env.prod'u yukle
echo -e "${GREEN}Environment degiskenleri yukleniyor...${NC}"
set -a
source .env.prod
set +a

# Node.js kontrolu
if ! command -v node &> /dev/null; then
    echo -e "${RED}HATA: Node.js kurulu degil!${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js versiyonu: $(node --version)${NC}"

# Yarn kontrolu
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}Yarn kurulu degil, npm ile kuruluyor...${NC}"
    npm install -g yarn
fi

echo -e "${GREEN}Yarn versiyonu: $(yarn --version)${NC}"

# Dependencies kurulumu
echo ""
echo -e "${YELLOW}Dependencies kuruluyor...${NC}"
yarn install --frozen-lockfile

# Backend build
echo ""
echo -e "${YELLOW}Backend build ediliyor...${NC}"
cd apps/backend

# Prisma generate
echo -e "${GREEN}Prisma client olusturuluyor...${NC}"
yarn prisma:generate

# Prisma migrate (production)
echo -e "${GREEN}Database migration calistiriliyor...${NC}"
yarn prisma:migrate:deploy

# Backend build
yarn build

cd "$ROOT_DIR"

# Admin frontend build
echo ""
echo -e "${YELLOW}Admin frontend build ediliyor...${NC}"
cd apps/admin

# .env.prod'u apps/admin icine kopyala (VITE icin)
cat > .env.production << EOF
VITE_APP_ENV=production
VITE_API_BASE_URL=${VITE_API_BASE_URL}
EOF

yarn build

cd "$ROOT_DIR"

echo ""
echo "========================================"
echo -e "${GREEN}BUILD TAMAMLANDI!${NC}"
echo "========================================"
echo ""
echo "Calistirmak icin:"
echo ""
echo "1. Backend (PM2 ile):"
echo "   cd apps/backend && pm2 start dist/main.js --name podcast-backend"
echo ""
echo "2. Admin Frontend (Nginx ile serve edin):"
echo "   Build dosyalari: apps/admin/dist/"
echo ""
echo "3. Ya da direkt test icin:"
echo "   Backend: cd apps/backend && yarn start:prod"
echo "   Admin:   cd apps/admin && yarn preview"
echo ""
