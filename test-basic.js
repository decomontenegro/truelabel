// Test basic functionality
console.log('Testing Trust Label implementations...\n');

// Test 1: Check if server dependencies are installed
console.log('1. Checking server dependencies:');
try {
  require('./server/node_modules/speakeasy');
  console.log('✓ speakeasy installed');
} catch (e) {
  console.log('✗ speakeasy not found');
}

try {
  require('./server/node_modules/rate-limiter-flexible');
  console.log('✓ rate-limiter-flexible installed');
} catch (e) {
  console.log('✗ rate-limiter-flexible not found');
}

// Test 2: Check if new files exist
console.log('\n2. Checking new files:');
const fs = require('fs');
const files = [
  'server/src/services/twoFactorService.ts',
  'server/src/middlewares/rateLimiter.ts',
  'server/src/config/sentry.ts',
  'server/src/controllers/statusController.ts',
  'client/src/pages/StatusPage.tsx',
  'client/src/components/FeedbackWidget.tsx',
  '.github/workflows/ci-cd.yml',
  'nginx.conf',
  'client/public/offline.html'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`✗ ${file} not found`);
  }
});

// Test 3: Simple API test
console.log('\n3. Testing basic API:');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3333,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`API Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log(`Response: ${d}`);
  });
});

req.on('error', (error) => {
  console.log('API not running or error:', error.message);
});

req.end();

console.log('\nTest complete!');