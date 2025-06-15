const axios = require('axios');

async function testFrontendProdutos() {
  console.log('🧪 TESTANDO CARREGAMENTO DE PRODUTOS NO FRONTEND\n');

  try {
    // Login para obter token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    // Simular exatamente o que o frontend faz agora
    console.log('\n1️⃣ SIMULANDO REQUISIÇÃO DO FRONTEND...');
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ Status: ${productsResponse.status}`);
    console.log(`✅ Produtos retornados: ${productsResponse.data.products.length}`);
    
    if (productsResponse.data.products.length > 0) {
      console.log('\n📋 PRODUTOS DISPONÍVEIS PARA SELEÇÃO:');
      productsResponse.data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.brand} (${product.status})`);
      });
      
      console.log('\n✅ PRODUTOS ENCONTRADOS! O select deveria estar populado.');
      console.log('   Se ainda estiver vazio, pode ser:');
      console.log('   - Cache do navegador');
      console.log('   - Erro de renderização no React');
      console.log('   - Token inválido no localStorage');
    } else {
      console.log('❌ NENHUM PRODUTO RETORNADO');
    }

    // Testar laboratórios também
    console.log('\n2️⃣ TESTANDO LABORATÓRIOS...');
    const labsResponse = await axios.get('http://localhost:3001/api/laboratories', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ Laboratórios: ${labsResponse.data.laboratories?.length || 0}`);

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Recarregue a página de relatórios');
    console.log('2. Abra o console do navegador (F12)');
    console.log('3. Procure por logs "Produtos carregados:" e "Laboratórios carregados:"');
    console.log('4. Verifique se há erros de CORS ou autenticação');

  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔑 PROBLEMA DE AUTENTICAÇÃO');
      console.log('   O token pode estar expirado ou inválido');
    }
  }
}

testFrontendProdutos();
