FROM node:20-alpine
WORKDIR /app

# Copy root package files
COPY package.json yarn.lock tsconfig.base.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/admin ./apps/admin

# Install dependencies with type definitions
RUN yarn install --frozen-lockfile --non-interactive --production=false

# Add missing type definitions explicitly
RUN yarn workspace @podcast-app/admin add -D @types/node @types/minimatch

# Build
WORKDIR /app/apps/admin
ARG BUILD_MODE=production
ARG VITE_API_BASE_URL=http://localhost:3300/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN yarn build --mode ${BUILD_MODE}

EXPOSE 5175

CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "5175"]
