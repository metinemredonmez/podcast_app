FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests
COPY ../../package.json ../../yarn.lock ./

# Copy dependencies required for the mobile workspace
COPY ../../packages ./packages
COPY ../../apps ./apps

# Install dependencies
RUN yarn install --frozen-lockfile --non-interactive --production=false

WORKDIR /app/apps/mobile

EXPOSE 19000
CMD ["yarn", "start"]
