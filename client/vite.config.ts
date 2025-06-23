/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { optimizePlugin, imageOptimizationPlugin } from './vite-plugin-optimize';

// https://vitejs.dev/config/
// Force rebuild to clear Vercel cache - v1.0.1
export default defineConfig({
  plugins: [
    react(),
    // optimizePlugin(),  // Temporariamente desabilitado - causando conflito com React
    // imageOptimizationPlugin(),  // Temporariamente desabilitado
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || process.env.VITE_PORT || '9101'),
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9100',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Simplificado para evitar problemas de circular dependencies
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'd3-shape', 'd3-scale'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});