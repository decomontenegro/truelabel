// True Label API - Vercel Proxy to Railway
// This proxies requests to the full Railway backend maintaining complete architecture
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Railway backend URL (will be updated after deployment)
  const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://truelabel-production.up.railway.app';
  
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
    return res.json({
      success: false,
      message: 'Backend temporarily unavailable - Railway deployment in progress',
      fallback: true,
      error: error.message
    });
  }
};
