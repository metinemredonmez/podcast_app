# Mobile App

Expo/React Native client for podcast listeners with offline playback, subscriptions, and live notifications.

## Getting Started

```bash
cd apps/mobile
yarn install
yarn start --tunnel --port 19005
```

Metro will expose the dev server on `http://localhost:19005`. Update Expo CLI as needed.

## Environment Files

- `.env.shared` – shared backend credentials distributed to every service.
- `apps/mobile/.env.dev` – Expo development defaults (`EXPO_ENV=development`, `EXPO_PUBLIC_API_BASE_URL`).
- `apps/mobile/.env.prod` – production defaults (`EXPO_ENV=production`).

Compose stacks automatically source `.env.shared` and the matching mobile env file.

## Build Pipeline

- Bundled web export: `yarn build --mode <development|production>` (wraps `npx expo export` via `scripts/build.js`).
- Container builds supply `BUILD_MODE`; dev compose builds run `yarn build --mode development` to keep parity with Expo dev behaviour.

When running the container image, the default command remains `yarn start --host 0.0.0.0 --port 19005`.
