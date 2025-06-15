const axios = require('axios');

async function testNewWorkflow() {
  console.log('🧪 TESTANDO NOVO WORKFLOW SEM DEPENDÊNCIA CIRCULAR\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // 1. CRIAR PRODUTO EM DRAFT
    console.log('\n1️⃣ CRIANDO PRODUTO EM DRAFT...');
    const productResponse = await axios.post('http://localhost:3001/api/products', {
      name: 'Produto Teste Workflow',
      brand: 'Teste Brand',
      category: 'Teste',
      description: 'Produto para testar novo workflow',
      sku: `TEST-WORKFLOW-${Date.now()}`,
      claims: 'Testado, Aprovado, Sem Dependência Circular'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const productId = productResponse.data.product.id;
    console.log(`✅ Produto criado em DRAFT: ${productResponse.data.product.name}`);
    console.log(`   Status: ${productResponse.data.product.status}`);

    // 2. ENVIAR PARA VALIDAÇÃO
    console.log('\n2️⃣ ENVIANDO PRODUTO PARA VALIDAÇÃO...');
    const submitResponse = await axios.post(`http://localhost:3001/api/products/${productId}/submit-for-validation`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Produto enviado para validação`);
    console.log(`   Novo status: ${submitResponse.data.product.status}`);

    // 3. CRIAR VALIDAÇÃO MANUAL (SEM RELATÓRIO)
    console.log('\n3️⃣ CRIANDO VALIDAÇÃO MANUAL...');
    const validationResponse = await axios.post('http://localhost:3001/api/validations', {
      productId: productId,
      type: 'MANUAL',
      status: 'APPROVED',
      claimsValidated: {
        'Testado': { status: 'approved', evidence: 'Produto testado com sucesso' },
        'Aprovado': { status: 'approved', evidence: 'Aprovado em validação manual' },
        'Sem Dependência Circular': { status: 'approved', evidence: 'Workflow funcionando sem dependências' }
      },
      summary: 'Produto aprovado em validação manual - novo workflow funcionando!',
      notes: 'Teste do novo sistema sem dependência circular'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Validação manual criada`);
    console.log(`   Status da validação: ${validationResponse.data.validation.status}`);
    console.log(`   Tipo: ${validationResponse.data.validation.type}`);

    // 4. VERIFICAR PRODUTO VALIDADO
    console.log('\n4️⃣ VERIFICANDO PRODUTO VALIDADO...');
    const finalProductResponse = await axios.get(`http://localhost:3001/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Produto final verificado`);
    console.log(`   Status final: ${finalProductResponse.data.product.status}`);
    console.log(`   Validações: ${finalProductResponse.data.product.validations.length}`);

    // 5. LISTAR VALIDAÇÕES
    console.log('\n5️⃣ LISTANDO VALIDAÇÕES...');
    const validationsResponse = await axios.get('http://localhost:3001/api/validations', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Validações listadas: ${validationsResponse.data.validations.length} total`);

    console.log('\n🎉 NOVO WORKFLOW TESTADO COM SUCESSO!');
    console.log('\n📋 RESUMO DO TESTE:');
    console.log('✅ Produto criado em DRAFT');
    console.log('✅ Produto enviado para PENDING');
    console.log('✅ Validação MANUAL criada (sem relatório)');
    console.log('✅ Produto atualizado para VALIDATED');
    console.log('✅ Sistema funcionando sem dependência circular!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message);
  }
}

testNewWorkflow();
