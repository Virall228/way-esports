import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
        },
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    styles: ['styled-components'],
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        chunkSizeWarningLimit: 1000,
        target: 'es2015',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 3000,
        host: true,
        open: true,
        hmr: {
            overlay: false,
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
                ws: true,
            },
        },
    },
    optimizeDeps: {
        include: [
            'react', 
            'react-dom', 
            'react-router-dom', 
            'styled-components'
        ],
        exclude: [],
    },
    css: {
        devSourcemap: false,
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
}); 