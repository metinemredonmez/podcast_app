import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const workspaceEnv = loadEnv(mode, path.resolve(__dirname, '..', '..'), '');
  const localEnv = loadEnv(mode, __dirname, '');
  const mergedEnv = { ...workspaceEnv, ...localEnv };

  for (const [key, value] of Object.entries(mergedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@api': '/src/api',
        '@components': '/src/components',
        '@pages': '/src/pages',
        '@store': '/src/store',
        '@hooks': '/src/hooks',
        '@utils': '/src/utils',
        '@types': '/src/types',
      },
    },

    server: {
      port: 5175,
      host: '0.0.0.0',
      strictPort: true,
    },

    preview: {
      port: 5175,
      host: '0.0.0.0',
      strictPort: true,
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
