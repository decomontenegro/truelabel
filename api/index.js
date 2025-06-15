  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.replace('/api', '') || '/';

  // Health check
  if (path === '/health') {
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'vercel-minimal'
    });
  }

  // Login endpoint
  if (path === '/auth/login' && req.method === 'POST') {
    return res.json({
      success: true,
      token: 'mock-jwt-token-123',
      user: {
        id: '1',
        email: 'admin@truelabel.com',
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
  }

  // Default response
  return res.json({
    success: true,
    message: 'True Label API - Minimal Vercel Function',
    path,
    method: req.method,
    note: 'For full functionality, use external backend'
  });
}