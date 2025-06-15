module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.replace('/api', '') || '/';

  if (path === '/health') {
    return res.json({
      success: true,
      message: 'True Label API is running',
      timestamp: new Date().toISOString()
    });
  }

  if (path === '/auth/login') {
    return res.json({
      success: true,
      token: 'mock-jwt-token-123',
      user: { id: '1', email: 'admin@truelabel.com', role: 'ADMIN' }
    });
  }

  return res.json({
    success: true,
    message: 'True Label API - Vercel',
    path: path,
    method: req.method
  });
};