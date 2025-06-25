import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// CDN URLs for production dependencies
const cdnUrls = {
  react: 'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
  'react-dom': 'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js',
  'react-router-dom': 'https://cdn.jsdelivr.net/npm/react-router-dom@6/dist/react-router-dom.production.min.js',
  axios: 'https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js',
  'date-fns': 'https://cdn.jsdelivr.net/npm/date-fns@2/index.min.js',
};

export default defineConfig({
  plugins: [
    react(),
    
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files > 10kb
      deleteOriginFile: false,
    }),
    
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    
    // PWA configuration for offline support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trust Label',
        short_name: 'TrustLabel',
        theme_color: '#0EA5E9',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.trustlabel\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
    
    // Bundle analyzer
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/bundle-analysis.html',
    }),
  ],
  
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      external: Object.keys(cdnUrls),
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-utils': ['axios', 'date-fns', 'clsx'],
          'vendor-charts': ['recharts'],
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          axios: 'axios',
          'date-fns': 'dateFns',
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096, // Inline assets < 4kb
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'date-fns',
      'zustand',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  
  // Production-specific optimizations
  esbuild: {
    drop: ['console', 'debugger'],
  },
});