const axios = require('axios');

async function testValidacaoAPI() {
  console.log('🧪 TESTANDO CRIAÇÃO DE VALIDAÇÃO VIA API\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // Buscar um produto DRAFT
    const productsResponse = await axios.get('http://localhost:3001/api/products?status=DRAFT', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (productsResponse.data.products.length === 0) {
      console.log('❌ Nenhum produto DRAFT encontrado');
      return;
    }

    const product = productsResponse.data.products[0];
    console.log(`✅ Produto selecionado: ${product.name} (ID: ${product.id})`);

    // Dados da validação (igual ao que o frontend enviaria)
    const validationData = {
      productId: product.id,
      type: 'MANUAL',
      status: 'APPROVED',
      claimsValidated: {
        'Testado': { status: 'approved', evidence: 'Produto testado' },
        'Funcional': { status: 'approved', evidence: 'Sistema funcionando' }
      },
      summary: 'Produto aprovado em validação manual via API',
      notes: 'Teste direto da API'
    };

    console.log('\n📤 ENVIANDO DADOS:');
    console.log(JSON.stringify(validationData, null, 2));

    // Criar validação
    console.log('\n🔄 CRIANDO VALIDAÇÃO...');
    const validationResponse = await axios.post('http://localhost:3001/api/validations', validationData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ VALIDAÇÃO CRIADA COM SUCESSO!');
    console.log(`   ID: ${validationResponse.data.validation.id}`);
    console.log(`   Status: ${validationResponse.data.validation.status}`);
    console.log(`   Tipo: ${validationResponse.data.validation.type}`);

    // Verificar produto atualizado
    const updatedProduct = await axios.get(`http://localhost:3001/api/products/${product.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Status do produto: ${updatedProduct.data.product.status}`);

  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status HTTP:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testValidacaoAPI();
