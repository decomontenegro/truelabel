const axios = require('axios');

async function testUsuarioLogado() {
  console.log('🧪 VERIFICANDO USUÁRIO LOGADO\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    // Verificar perfil do usuário
    console.log('\n1️⃣ VERIFICANDO PERFIL DO USUÁRIO...');
    const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Perfil do usuário:');
    console.log(`   ID: ${profileResponse.data.user.id}`);
    console.log(`   Email: ${profileResponse.data.user.email}`);
    console.log(`   Nome: ${profileResponse.data.user.name}`);
    console.log(`   Role: ${profileResponse.data.user.role}`);

    // Verificar se pode acessar validações
    console.log('\n2️⃣ TESTANDO ACESSO ÀS VALIDAÇÕES...');
    try {
      const validationsResponse = await axios.get('http://localhost:3001/api/validations', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ Acesso às validações: OK (${validationsResponse.data.validations.length} validações)`);
    } catch (error) {
      console.log(`❌ Erro ao acessar validações: ${error.response?.data?.error || error.message}`);
    }

    // Listar produtos do usuário
    console.log('\n3️⃣ LISTANDO PRODUTOS DO USUÁRIO...');
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Produtos encontrados: ${productsResponse.data.products.length}`);
    productsResponse.data.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.brand}) - Status: ${product.status} - Owner: ${product.userId || 'N/A'}`);
    });

    console.log('\n📊 RESUMO:');
    console.log(`✅ Usuário: ${profileResponse.data.user.role}`);
    console.log(`✅ Produtos: ${productsResponse.data.products.length}`);
    console.log('✅ Sistema pronto para validação!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message);
  }
}

testUsuarioLogado();
