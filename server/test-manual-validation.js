const axios = require('axios');

async function testManualValidation() {
  console.log('🧪 TESTANDO VALIDAÇÃO MANUAL (SEM RELATÓRIO)\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // Listar produtos PENDING
    console.log('\n1️⃣ LISTANDO PRODUTOS PENDING...');
    const productsResponse = await axios.get('http://localhost:3001/api/products?status=PENDING', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (productsResponse.data.products.length === 0) {
      console.log('❌ Nenhum produto PENDING encontrado');
      return;
    }

    const productId = productsResponse.data.products[0].id;
    console.log(`✅ Produto PENDING encontrado: ${productsResponse.data.products[0].name}`);
    console.log(`   ID: ${productId}`);

    // Criar validação manual
    console.log('\n2️⃣ CRIANDO VALIDAÇÃO MANUAL...');
    const validationResponse = await axios.post('http://localhost:3001/api/validations', {
      productId: productId,
      type: 'MANUAL',
      status: 'APPROVED',
      claimsValidated: {
        'Teste': { status: 'approved', evidence: 'Validação manual de teste' }
      },
      summary: 'Produto aprovado em validação manual - teste sem relatório',
      notes: 'Teste do novo sistema sem dependência circular'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Validação manual criada com sucesso!`);
    console.log(`   Status: ${validationResponse.data.validation.status}`);
    console.log(`   Tipo: ${validationResponse.data.validation.type}`);
    console.log(`   Relatório: ${validationResponse.data.validation.reportId || 'NENHUM (validação manual)'}`);

    console.log('\n🎉 VALIDAÇÃO MANUAL FUNCIONANDO!');
    console.log('✅ Sistema permite validação sem relatório');
    console.log('✅ Dependência circular quebrada com sucesso!');

  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
  }
}

testManualValidation();
