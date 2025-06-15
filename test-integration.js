#!/usr/bin/env node

/**
 * True Label - Integration Test
 * Tests connection between Vercel frontend and Railway backend
 */

const https = require('https');

// Test URLs
const VERCEL_FRONTEND = 'https://truelabel.vercel.app';
const VERCEL_API = 'https://truelabel.vercel.app/api';
const POSSIBLE_RAILWAY_URLS = [
  'https://truelabel-production.up.railway.app',
  'https://web-production.up.railway.app',
  'https://true-label-production.up.railway.app',
  'https://truelabel.up.railway.app'
];

console.log('🔍 True Label - Integration Test');
console.log('================================');

// Helper function to test URL
function testUrl(url, path = '') {
  return new Promise((resolve) => {
    const fullUrl = url + path;
    console.log(`Testing: ${fullUrl}`);
    
    const req = https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url: fullUrl,
          status: res.statusCode,
          success: res.statusCode < 400,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url: fullUrl,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url: fullUrl,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runTests() {
  console.log('\n1. Testing Vercel Frontend...');
  const frontendTest = await testUrl(VERCEL_FRONTEND);
  console.log(`   Status: ${frontendTest.status} - ${frontendTest.success ? '✅' : '❌'}`);
  
  console.log('\n2. Testing Vercel API Proxy...');
  const apiTest = await testUrl(VERCEL_API, '/health');
  console.log(`   Status: ${apiTest.status} - ${apiTest.success ? '✅' : '❌'}`);
  if (!apiTest.success) {
    console.log(`   Error: ${apiTest.error || 'API proxy not working'}`);
  }
  
  console.log('\n3. Testing Railway Backend URLs...');
  let railwayUrl = null;
  
  for (const url of POSSIBLE_RAILWAY_URLS) {
    const test = await testUrl(url, '/health');
    console.log(`   ${url} - ${test.status} - ${test.success ? '✅ FOUND!' : '❌'}`);
    
    if (test.success) {
      railwayUrl = url;
      break;
    }
  }
  
  console.log('\n📊 INTEGRATION STATUS:');
  console.log('======================');
  console.log(`Frontend (Vercel): ${frontendTest.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`API Proxy (Vercel): ${apiTest.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Backend (Railway): ${railwayUrl ? '✅ Found at ' + railwayUrl : '❌ Not found'}`);
  
  if (railwayUrl) {
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Update Vercel API proxy with Railway URL:');
    console.log(`   RAILWAY_API_URL=${railwayUrl}`);
    console.log('2. Test login flow:');
    console.log(`   curl -X POST ${railwayUrl}/auth/login -d '{"email":"admin@truelabel.com","password":"admin123"}'`);
  } else {
    console.log('\n🚨 RAILWAY BACKEND NOT FOUND:');
    console.log('1. Check Railway dashboard for correct URL');
    console.log('2. Verify Railway deployment is running');
    console.log('3. Check Railway logs for errors');
  }
  
  console.log('\n🎯 INTEGRATION READY:', frontendTest.success && railwayUrl ? '✅ YES' : '❌ NO');
}

runTests().catch(console.error);
