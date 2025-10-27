FROM node:20-alpine

WORKDIR /app

# Copy root manifests
COPY ../../package.json ../../yarn.lock ./

# Copy shared workspaces needed for backend build
COPY ../../packages ./packages
COPY ../../apps ./apps

# Install dependencies for the entire workspace
RUN yarn install --frozen-lockfile --non-interactive --production=false

# Build backend
WORKDIR /app/apps/backend
RUN yarn build

# Expose API port and start in production mode
EXPOSE 3000
CMD ["yarn", "start:prod"]
