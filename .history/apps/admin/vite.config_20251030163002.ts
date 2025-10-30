import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
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
});
