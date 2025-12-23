#!/bin/sh
set -e

# Run database migrations
yarn prisma:migrate:deploy

# Seed data for non-production environments
if [ "${NODE_ENV}" != "production" ] && [ "${SKIP_DB_SEED}" != "true" ]; then
  if yarn run | grep -q "prisma:db:seed"; then
    yarn prisma:db:seed
  fi
fi

exec "$@"
