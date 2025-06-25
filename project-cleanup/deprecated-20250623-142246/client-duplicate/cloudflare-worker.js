// CloudFlare Worker for optimized asset delivery

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Security headers
  const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.trustlabel.com wss://api.trustlabel.com",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  // Cache configuration
  const cacheConfig = {
    '/assets/': { maxAge: 31536000, immutable: true }, // 1 year for hashed assets
    '/images/': { maxAge: 86400 }, // 1 day for images
    '/api/': { maxAge: 0, noCache: true }, // No cache for API
    '/': { maxAge: 3600 }, // 1 hour for HTML
  };

  // Determine cache settings based on path
  let cacheControl = 'public, max-age=3600'; // Default 1 hour
  for (const [path, config] of Object.entries(cacheConfig)) {
    if (url.pathname.startsWith(path)) {
      if (config.noCache) {
        cacheControl = 'no-cache, no-store, must-revalidate';
      } else {
        cacheControl = `public, max-age=${config.maxAge}`;
        if (config.immutable) {
          cacheControl += ', immutable';
        }
      }
      break;
    }
  }

  // Image optimization
  if (url.pathname.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
    return handleImageRequest(request, url);
  }

  // Fetch the original response
  const response = await fetch(request);
  
  // Clone the response to modify headers
  const modifiedResponse = new Response(response.body, response);
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    modifiedResponse.headers.set(key, value);
  });
  
  // Add cache control
  modifiedResponse.headers.set('Cache-Control', cacheControl);
  
  // Add compression hint
  if (url.pathname.match(/\.(js|css|html|json|svg|xml)$/i)) {
    modifiedResponse.headers.set('Content-Encoding', 'gzip');
  }
  
  // Add CORS headers for API requests
  if (url.pathname.startsWith('/api/')) {
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return modifiedResponse;
}

async function handleImageRequest(request, url) {
  // Extract image transformation parameters
  const params = url.searchParams;
  const width = params.get('w');
  const quality = params.get('q') || '85';
  const format = params.get('f') || 'auto';
  
  // Build Cloudflare Image Resizing options
  const options = {
    cf: {
      image: {
        fit: 'scale-down',
        quality: parseInt(quality),
        format: format === 'auto' ? undefined : format,
      },
    },
  };
  
  if (width) {
    options.cf.image.width = parseInt(width);
  }
  
  // Fetch with image transformations
  const response = await fetch(request, options);
  
  // Add optimized cache headers
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Vary', 'Accept');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Service Worker for offline support
const CACHE_NAME = 'trust-label-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/images/logo.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        return caches.match('/offline.html');
      })
  );
});