// Cloudflare Worker for Edge Caching
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Cache configuration
const CACHE_NAME = 'truelabel-edge-v1'
const CACHE_TTL = {
  '/api/v1/public/products': 3600,      // 1 hour
  '/api/v1/public/categories': 86400,   // 24 hours
  '/api/v1/public/seals': 86400,        // 24 hours
  '/api/v1/public/qr': 300,              // 5 minutes
}

// Helper to get cache key
function getCacheKey(request) {
  const url = new URL(request.url)
  // Include query params for dynamic content
  return `${url.pathname}${url.search}`
}

// Helper to determine if request should be cached
function shouldCache(request) {
  const url = new URL(request.url)
  const method = request.method
  
  // Only cache GET requests
  if (method !== 'GET') return false
  
  // Check if path is in cache configuration
  for (const path of Object.keys(CACHE_TTL)) {
    if (url.pathname.startsWith(path)) {
      return true
    }
  }
  
  return false
}

// Get TTL for specific path
function getTTL(pathname) {
  for (const [path, ttl] of Object.entries(CACHE_TTL)) {
    if (pathname.startsWith(path)) {
      return ttl
    }
  }
  return 300 // Default 5 minutes
}

// Handle request
async function handleRequest(request) {
  // Check if request should be cached
  if (!shouldCache(request)) {
    return fetch(request)
  }
  
  const cache = caches.default
  const cacheKey = getCacheKey(request)
  
  // Try to get from cache
  let response = await cache.match(cacheKey)
  
  if (response) {
    // Check if cache is still fresh
    const cacheTime = response.headers.get('X-Cache-Time')
    const ttl = getTTL(new URL(request.url).pathname)
    
    if (cacheTime) {
      const age = Date.now() - parseInt(cacheTime)
      if (age < ttl * 1000) {
        // Return cached response with cache headers
        response = new Response(response.body, response)
        response.headers.set('X-Cache-Status', 'HIT')
        response.headers.set('X-Cache-Age', Math.floor(age / 1000))
        response.headers.set('Cache-Control', `public, max-age=${ttl - Math.floor(age / 1000)}`)
        return response
      }
    }
  }
  
  // Fetch from origin
  response = await fetch(request)
  
  // Only cache successful responses
  if (response.status === 200) {
    // Clone response for caching
    const responseToCache = response.clone()
    
    // Add cache metadata
    const headers = new Headers(responseToCache.headers)
    headers.set('X-Cache-Time', Date.now().toString())
    headers.set('X-Cache-Status', 'MISS')
    headers.set('Cache-Control', `public, max-age=${getTTL(new URL(request.url).pathname)}`)
    
    // Create new response with headers
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    })
    
    // Store in cache
    event.waitUntil(cache.put(cacheKey, cachedResponse))
    
    // Return response with cache status
    const returnResponse = new Response(response.body, response)
    returnResponse.headers.set('X-Cache-Status', 'MISS')
    return returnResponse
  }
  
  return response
}

// Purge cache endpoint
addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  
  // Admin purge endpoint
  if (url.pathname === '/api/v1/cache/purge' && event.request.method === 'POST') {
    event.respondWith(handlePurge(event.request))
  }
})

async function handlePurge(request) {
  // Verify authentication
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // In production, verify the token properly
  // For now, we'll use a simple check
  const token = authHeader.substring(7)
  if (token !== PURGE_TOKEN) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // Get paths to purge from request body
  const body = await request.json()
  const paths = body.paths || []
  
  const cache = caches.default
  const purged = []
  
  for (const path of paths) {
    const deleted = await cache.delete(path)
    if (deleted) {
      purged.push(path)
    }
  }
  
  return new Response(JSON.stringify({
    success: true,
    purged: purged,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}