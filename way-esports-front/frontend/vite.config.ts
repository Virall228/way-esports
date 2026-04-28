import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('react-router')) return 'router';
            if (
              id.includes('react-dom') ||
              id.includes('react/index') ||
              id.endsWith('/react.js') ||
              id.includes('scheduler')
            ) {
              return 'react-core';
            }
            if (id.includes('styled-components')) return 'styled';
          }

          if (id.includes('/src/pages/Admin/')) return 'admin';
          if (id.includes('/src/pages/Analytics/')) return 'analytics';
          if (id.includes('/src/pages/ScoutHub/')) return 'scout-hub';
          if (id.includes('/src/pages/Tournaments/')) return 'tournaments';

          return undefined;
        }
      }
    }
  },
  define: {
    'process.env': {}
  }
});
