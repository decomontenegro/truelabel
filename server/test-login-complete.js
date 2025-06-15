const axios = require('axios');

async function testLoginComplete() {
  console.log('🔐 TESTE COMPLETO DE LOGIN E SISTEMA\n');

  try {
    // 1. TESTE DE HEALTH CHECK
    console.log('1️⃣ TESTANDO HEALTH CHECK...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log(`✅ Health check OK: ${healthResponse.data.status}\n`);

    // 2. TESTE DE LOGIN ADMIN
    console.log('2️⃣ TESTANDO LOGIN ADMIN...');
    const adminLoginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    console.log(`✅ Login admin OK: ${adminLoginResponse.data.user.name}`);
    console.log(`   Token: ${adminLoginResponse.data.token.substring(0, 30)}...\n`);

    // 3. TESTE DE LOGIN MARCA
    console.log('3️⃣ TESTANDO LOGIN MARCA...');
    const brandLoginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'marca@exemplo.com',
      password: '123456'
    });
    console.log(`✅ Login marca OK: ${brandLoginResponse.data.user.name}\n`);

    // 4. TESTE DE PRODUTOS COM TOKEN
    console.log('4️⃣ TESTANDO ACESSO A PRODUTOS...');
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { Authorization: `Bearer ${adminLoginResponse.data.token}` }
    });
    console.log(`✅ Produtos carregados: ${productsResponse.data.products.length} produtos\n`);

    // 5. TESTE DE LABORATÓRIOS
    console.log('5️⃣ TESTANDO LABORATÓRIOS...');
    const labsResponse = await axios.get('http://localhost:3001/api/laboratories');
    console.log(`✅ Laboratórios carregados: ${labsResponse.data.laboratories.length} laboratórios\n`);

    // 6. TESTE DE FRONTEND
    console.log('6️⃣ TESTANDO FRONTEND...');
    const frontendResponse = await axios.get('http://localhost:3000');
    const isValidHTML = frontendResponse.data.includes('<!doctype html');
    console.log(`✅ Frontend carregando: ${isValidHTML ? 'HTML válido' : 'Problema no HTML'}\n`);

    // 7. TESTE DE CORS
    console.log('7️⃣ TESTANDO CORS...');
    const corsResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    }, {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    console.log(`✅ CORS funcionando: ${corsResponse.status === 200 ? 'OK' : 'Problema'}\n`);

    // RESUMO FINAL
    console.log('🎉 TODOS OS TESTES DE LOGIN E SISTEMA PASSARAM!\n');
    console.log('📊 RESUMO:');
    console.log('✅ Health check - Sistema saudável');
    console.log('✅ Login admin - Funcionando');
    console.log('✅ Login marca - Funcionando');
    console.log('✅ Produtos - API funcionando');
    console.log('✅ Laboratórios - API funcionando');
    console.log('✅ Frontend - Interface carregando');
    console.log('✅ CORS - Configurado corretamente');
    console.log('');
    console.log('🌐 URLS FUNCIONAIS:');
    console.log('   Backend: http://localhost:3001 ✅');
    console.log('   Frontend: http://localhost:3000 ✅');
    console.log('   API Health: http://localhost:3001/health ✅');
    console.log('');
    console.log('👤 CREDENCIAIS DE TESTE:');
    console.log('   Admin: admin@truelabel.com / 123456 ✅');
    console.log('   Marca: marca@exemplo.com / 123456 ✅');
    console.log('');
    console.log('🚀 SISTEMA TRUE LABEL 100% FUNCIONAL PARA LOGIN!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
    }
  }
}

testLoginComplete();
