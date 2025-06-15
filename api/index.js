// True Label API - Vercel Proxy to Railway (Native HTTPS)
const https = require('https');
const { URL } = require('url');

module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Railway backend URL
  const RAILWAY_API_URL = 'https://truelabel-production.up.railway.app';
  const targetPath = req.url.replace('/api', '') || '/';
  const targetUrl = new URL(targetPath, RAILWAY_API_URL);

  // Prepare request options
  const options = {
    hostname: targetUrl.hostname,
    port: 443,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization || '',
      'User-Agent': 'TrueLabel-Vercel-Proxy/1.0'
    }
  };

  // Make request to Railway
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';

    proxyRes.on('data', (chunk) => {
      data += chunk;
    });

    proxyRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        res.status(proxyRes.statusCode).json(jsonData);
      } catch (error) {
        res.status(proxyRes.statusCode).send(data);
      }
    });
  });

  proxyReq.on('error', (error) => {
    res.status(503).json({
      success: false,
      message: 'Backend temporarily unavailable',
      railway_url: RAILWAY_API_URL,
      error: error.message
    });
  });

  // Send request body for POST/PUT requests
  if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }

  proxyReq.end();
};
