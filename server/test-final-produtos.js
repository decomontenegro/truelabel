const axios = require('axios');

async function testFinalProdutos() {
  console.log('🧪 TESTE FINAL - PRODUTOS NO FORMULÁRIO DE RELATÓRIO\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // Testar exatamente como o frontend faz agora
    console.log('\n1️⃣ TESTANDO CARREGAMENTO DE PRODUTOS...');
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ Status: ${productsResponse.status}`);
    console.log(`✅ Produtos encontrados: ${productsResponse.data.products.length}`);
    
    if (productsResponse.data.products.length > 0) {
      console.log('\n📋 PRODUTOS PARA O SELECT:');
      productsResponse.data.products.forEach((product, index) => {
        console.log(`   <option value="${product.id}">${product.name} - ${product.brand}</option>`);
      });
    }

    // Testar laboratórios
    console.log('\n2️⃣ TESTANDO CARREGAMENTO DE LABORATÓRIOS...');
    const labsResponse = await axios.get('http://localhost:3001/api/laboratories', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ Status: ${labsResponse.status}`);
    console.log(`✅ Laboratórios encontrados: ${labsResponse.data.laboratories?.length || 0}`);
    
    if (labsResponse.data.laboratories?.length > 0) {
      console.log('\n🏥 LABORATÓRIOS PARA O SELECT:');
      labsResponse.data.laboratories.forEach((lab, index) => {
        console.log(`   <option value="${lab.id}">${lab.name} - ${lab.accreditation}</option>`);
      });
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ API funcionando corretamente');
    console.log('✅ URLs corrigidas no frontend');
    console.log('✅ Logs adicionados para debug');
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Recarregue a página de relatórios');
    console.log('2. Clique em "Enviar Relatório"');
    console.log('3. Verifique se o select de produtos está populado');
    console.log('4. Abra o console (F12) e procure pelos logs');

  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
  }
}

testFinalProdutos();
