// True Label API - Vercel Proxy to Railway Backend
// Maintains complete architecture by proxying to Railway
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Railway backend URL - will be updated when we get the correct URL
  const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://truelabel-production.up.railway.app';

  // Temporary fallback while Railway is deploying
  if (req.url.replace('/api', '') === '/health') {
    return res.json({
      status: 'proxy-ready',
      message: 'Vercel proxy configured, waiting for Railway URL',
      railway_url: RAILWAY_API_URL,
      timestamp: new Date().toISOString(),
      note: 'Update RAILWAY_API_URL environment variable with correct URL'
    });
  }

  try {
    // Proxy request to Railway backend
    const url = `${RAILWAY_API_URL}${req.url.replace('/api', '')}`;

    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'User-Agent': 'TrueLabel-Vercel-Proxy/1.0'
      }
    };

    // Add body for POST/PUT/PATCH requests
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Railway proxy error:', error);

    // Fallback response with helpful information
    return res.status(503).json({
      success: false,
      message: 'Backend temporarily unavailable',
      details: 'Railway backend is starting up or temporarily down',
      railway_url: RAILWAY_API_URL,
      proxy_error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};