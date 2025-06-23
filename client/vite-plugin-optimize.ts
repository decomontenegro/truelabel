import { Plugin } from 'vite';
import { OutputOptions } from 'rollup';

/**
 * Custom Vite plugin for advanced optimizations
 */
export function optimizePlugin(): Plugin {
  return {
    name: 'vite-plugin-optimize',
    
    // Optimize HTML
    transformIndexHtml(html) {
      // Add resource hints
      const resourceHints = `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://api.yourdomain.com">
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
      `;
      
      // Add critical CSS inline
      const criticalCSS = `
        <style>
          /* Critical CSS for above-the-fold content */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .loading { display: flex; align-items: center; justify-content: center; height: 100vh; }
          .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;
      
      // Add loading spinner
      const loadingSpinner = `
        <div id="app-loading" class="loading">
          <div class="spinner"></div>
        </div>
        <script>
          window.addEventListener('DOMContentLoaded', () => {
            const loader = document.getElementById('app-loading');
            if (loader) setTimeout(() => loader.style.display = 'none', 100);
          });
        </script>
      `;
      
      return html
        .replace('</head>', `${resourceHints}${criticalCSS}</head>`)
        .replace('<div id="root"></div>', `<div id="root">${loadingSpinner}</div>`);
    },
    
    // Configure build optimizations
    config() {
      return {
        build: {
          // Advanced minification
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
              passes: 2,
              global_defs: {
                '@__INLINE__': 'true',
              },
            },
            mangle: {
              safari10: true,
              properties: {
                regex: /^_/,
              },
            },
            format: {
              comments: false,
              ascii_only: true,
            },
          },
          
          // Rollup optimizations
          rollupOptions: {
            output: {
              // Manual chunks for better caching
              manualChunks: (id) => {
                // Node modules chunking
                if (id.includes('node_modules')) {
                  // React ecosystem
                  if (id.includes('react')) {
                    if (id.includes('react-dom')) return 'react-dom';
                    if (id.includes('react-router')) return 'react-router';
                    return 'react-core';
                  }
                  
                  // UI libraries
                  if (id.includes('@headlessui') || id.includes('react-hot-toast')) {
                    return 'ui-libs';
                  }
                  
                  // Icons
                  if (id.includes('lucide-react') || id.includes('@heroicons')) {
                    return 'icons';
                  }
                  
                  // State management
                  if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
                    return 'state';
                  }
                  
                  // Form handling
                  if (id.includes('react-hook-form') || id.includes('zod')) {
                    return 'forms';
                  }
                  
                  // Charts
                  if (id.includes('recharts') || id.includes('d3')) {
                    return 'charts';
                  }
                  
                  // Utilities
                  if (id.includes('axios') || id.includes('date-fns')) {
                    return 'utils';
                  }
                  
                  // Everything else
                  return 'vendor';
                }
              },
              
              // Optimize asset names
              assetFileNames: (assetInfo) => {
                const info = assetInfo.name?.split('.');
                const ext = info?.[info.length - 1];
                
                if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext!)) {
                  return `assets/images/[name]-[hash][extname]`;
                }
                
                if (/woff2?|ttf|eot/i.test(ext!)) {
                  return `assets/fonts/[name]-[hash][extname]`;
                }
                
                return `assets/[name]-[hash][extname]`;
              },
              
              chunkFileNames: 'js/[name]-[hash].js',
              entryFileNames: 'js/[name]-[hash].js',
            } as OutputOptions,
          },
        },
      };
    },
  };
}

/**
 * Image optimization plugin
 */
export function imageOptimizationPlugin(): Plugin {
  return {
    name: 'vite-plugin-image-optimization',
    
    async transform(code, id) {
      // Only process image imports
      if (!/\.(png|jpe?g|gif|svg|webp)$/i.test(id)) {
        return null;
      }
      
      // In a real implementation, you would:
      // 1. Use sharp or imagemin to optimize the image
      // 2. Generate responsive versions
      // 3. Convert to WebP format
      // 4. Return optimized versions
      
      return null;
    },
  };
}

/**
 * PWA plugin configuration
 */
export function pwaConfig() {
  return {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    manifest: {
      name: 'True Label',
      short_name: 'TrueLabel',
      description: 'Plataforma de validação transparente para produtos CPG',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/api\.yourdomain\.com\/api\/v1\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  };
}