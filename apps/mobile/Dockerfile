FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Copy packages and mobile app
COPY packages ./packages
COPY apps/mobile ./apps/mobile

# Install dependencies
RUN yarn install --frozen-lockfile --non-interactive --production=false

WORKDIR /app/apps/mobile

EXPOSE 19005

CMD ["yarn", "start", "--host", "0.0.0.0", "--port", "19005"]
