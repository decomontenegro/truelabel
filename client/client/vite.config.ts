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
    optimizePlugin(),
    imageOptimizationPlugin(),
  ],
  base: process.env.NODE_ENV === 'production' ? '/truelabel/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5001'),
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || '5000'}`,
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
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500, // Aumentado para evitar warnings desnecessários
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React - crítico, carregar primeiro
            if (id.includes('react') && !id.includes('react-') && !id.includes('@react')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }
            
            // UI Components - segundo nível de prioridade
            if (id.includes('lucide-react') || id.includes('@heroicons')) {
              return 'icons';
            }
            if (id.includes('@headlessui') || id.includes('react-hot-toast')) {
              return 'ui-components';
            }
            
            // Animações - carregar sob demanda
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            
            // Charts - dividir em chunks menores
            if (id.includes('recharts')) {
              return 'charts-recharts';
            }
            if (id.includes('d3-')) {
              return 'charts-d3';
            }
            
            // Forms & Validation
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
            if (id.includes('zod')) {
              return 'validation';
            }
            
            // Data fetching & state
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('zustand')) {
              return 'state';
            }
            if (id.includes('axios')) {
              return 'http';
            }
            
            // Utilities
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            if (id.includes('qrcode')) {
              return 'qr-utils';
            }
            
            // Sentry - opcional
            if (id.includes('@sentry')) {
              return 'monitoring';
            }
            
            // Tudo mais no vendor
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name?.split('.').at(1) || 'asset';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
      // Externalizar dependências grandes (opcional para CDN)
      external: [],
      // Tree-shaking mais agressivo
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    cssMinify: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // Target browsers modernos
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});