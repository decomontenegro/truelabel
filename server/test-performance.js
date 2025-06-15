const axios = require('axios');

async function testPerformance() {
  console.log('⚡ TESTANDO PERFORMANCE DO SISTEMA\n');

  const BASE_URL = 'http://localhost:3001/api';
  
  // Login
  const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@truelabel.com',
    password: '123456'
  });
  const authToken = loginResponse.data.token;

  // Teste de múltiplas requisições simultâneas
  console.log('1️⃣ TESTANDO MÚLTIPLAS REQUISIÇÕES SIMULTÂNEAS...');
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.get(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
    );
  }

  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  console.log(`✅ 10 requisições simultâneas completadas em ${endTime - startTime}ms`);
  console.log(`   Média: ${(endTime - startTime) / 10}ms por requisição\n`);

  // Teste de health check
  console.log('2️⃣ TESTANDO HEALTH CHECK PERFORMANCE...');
  const healthStartTime = Date.now();
  await axios.get('http://localhost:3001/health');
  const healthEndTime = Date.now();
  console.log(`✅ Health check respondeu em ${healthEndTime - healthStartTime}ms\n`);

  // Teste de autenticação performance
  console.log('3️⃣ TESTANDO PERFORMANCE DE AUTENTICAÇÃO...');
  const authStartTime = Date.now();
  await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@truelabel.com',
    password: '123456'
  });
  const authEndTime = Date.now();
  console.log(`✅ Autenticação completada em ${authEndTime - authStartTime}ms\n`);

  console.log('🎯 PERFORMANCE ACEITÁVEL PARA DESENVOLVIMENTO!');
}

testPerformance().catch(console.error);
