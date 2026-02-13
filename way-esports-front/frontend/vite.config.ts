import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    minify: 'esbuild', // Используем esbuild (быстрее и встроен в Vite, не требует дополнительных зависимостей)
    // Если нужен terser, раскомментируйте и убедитесь что terser установлен в package.json
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true
    //   }
    // },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'telegram': []
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env': {}
  }
})
