FROM node:20-alpine AS builder
WORKDIR /app

# Copy root files
COPY package.json yarn.lock ./
COPY tsconfig.base.json ./

# Copy packages
COPY packages ./packages

# Copy backend app
COPY apps/backend ./apps/backend

# Install dependencies
RUN yarn install --frozen-lockfile --non-interactive

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN yarn prisma:generate

# Build application
RUN yarn build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json

# Copy Prisma files
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/backend/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3300

CMD ["node", "dist/main.js"]
