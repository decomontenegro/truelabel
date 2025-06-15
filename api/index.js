// True Label API - Vercel Proxy to Railway
// Automatically configured by configure-railway-integration.sh
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Railway backend URL
  const RAILWAY_API_URL = 'https://truelabel-production.up.railway.app';
  
  try {
    // Proxy request to Railway backend
    const response = await fetch(`${RAILWAY_API_URL}${req.url.replace('/api', '')}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: req.method !== 'GET' && req.method !== 'DELETE' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    // Fallback response if Railway is down
    return res.status(503).json({
      success: false,
      message: 'Backend temporarily unavailable',
      railway_url: RAILWAY_API_URL,
      error: error.message
    });
  }
};
