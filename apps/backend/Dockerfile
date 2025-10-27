FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm install --prod --frozen-lockfile
CMD ["node", "dist/main.js"]
