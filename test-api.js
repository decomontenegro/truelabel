// Test API endpoints with correct port
const http = require('http');

console.log('🔍 Testing Trust Label API Endpoints\n');

const API_PORT = 9100; // Correct port

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path: path,
      method: method,
      timeout: 5000
    };

    console.log(`Testing ${method} ${path}...`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`  Status: ${res.statusCode}`);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`  Response:`, parsed);
          } catch {
            console.log(`  Response:`, data.substring(0, 100));
          }
        }
        console.log();
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}\n`);
      resolve(null);
    });

    req.on('timeout', () => {
      console.log(`  ⏱️  Timeout\n`);
      req.destroy();
      resolve(null);
    });

    // Add body for POST requests
    if (method === 'POST') {
      req.setHeader('Content-Type', 'application/json');
    }

    req.end();
  });
}

async function runTests() {
  console.log(`🌐 API Server: http://localhost:${API_PORT}\n`);
  
  // Test basic endpoints
  await testEndpoint('/health');
  await testEndpoint('/api/health');
  await testEndpoint('/api-docs');
  await testEndpoint('/metrics');
  await testEndpoint('/api/monitoring/dashboard');
  
  // Test new endpoints
  await testEndpoint('/api/status');
  
  console.log('✅ API test completed!');
  console.log('\n📝 Notes:');
  console.log('- Server is running on port 9100 (not 3333)');
  console.log('- API docs available at: http://localhost:9100/api-docs');
  console.log('- Health check at: http://localhost:9100/health');
}

runTests();