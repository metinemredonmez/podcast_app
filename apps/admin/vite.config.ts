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
      // Enable source maps for production debugging
      sourcemap: mode === 'development',
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/lab', '@mui/system'],
            'vendor-mui-x': ['@mui/x-charts', '@mui/x-date-pickers'],
            'vendor-forms': ['formik', 'yup'],
            'vendor-charts': ['apexcharts', 'react-apexcharts'],
            'vendor-utils': ['lodash', 'date-fns', 'axios'],
            // Feature chunks
            'feature-live': [
              './src/pages/live-stream/LiveStreamsPage.tsx',
              './src/pages/live-stream/LiveBroadcastPage.tsx',
              './src/pages/live-stream/LivePlayerPage.tsx',
            ],
          },
        },
      },
      // Reduce chunk size warnings threshold
      chunkSizeWarningLimit: 500,
    },
  };
});
