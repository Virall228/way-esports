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
    // Temporary stability mode: keep output readable and preserve execution order
    // while tracking down Telegram WebView runtime TDZ in production bundle.
    sourcemap: true,
    minify: false,
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env': {}
  }
});
