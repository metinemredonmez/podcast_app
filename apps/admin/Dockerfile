FROM node:20-alpine

WORKDIR /app

# Copy root manifests and shared configuration
COPY package.json yarn.lock ./
COPY tsconfig.base.json ./tsconfig.base.json

# Copy monorepo workspaces required for build
COPY packages ./packages
COPY apps ./apps

RUN yarn install --frozen-lockfile --non-interactive --production=false

WORKDIR /app/apps/admin
RUN yarn build

EXPOSE 5175
CMD ["yarn", "preview"]
