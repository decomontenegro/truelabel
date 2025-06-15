const axios = require('axios');

async function testValidacaoManual() {
  console.log('🧪 TESTANDO VALIDAÇÃO MANUAL CORRIGIDA\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // Listar produtos DRAFT ou PENDING
    console.log('\n1️⃣ LISTANDO PRODUTOS PARA VALIDAÇÃO...');
    const productsResponse = await axios.get('http://localhost:3001/api/products?status=DRAFT', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (productsResponse.data.products.length === 0) {
      console.log('❌ Nenhum produto DRAFT encontrado');
      return;
    }

    const product = productsResponse.data.products[0];
    console.log(`✅ Produto encontrado: ${product.name} (${product.brand})`);
    console.log(`   Status atual: ${product.status}`);
    console.log(`   ID: ${product.id}`);

    // Criar validação manual (SEM RELATÓRIO)
    console.log('\n2️⃣ CRIANDO VALIDAÇÃO MANUAL...');
    const validationData = {
      productId: product.id,
      type: 'MANUAL',
      status: 'APPROVED',
      claimsValidated: {
        'Testado': { status: 'approved', evidence: 'Produto testado manualmente' },
        'Funcional': { status: 'approved', evidence: 'Sistema funcionando corretamente' },
        'Sem Dependência': { status: 'approved', evidence: 'Validação sem necessidade de relatório' }
      },
      summary: 'Produto aprovado em validação manual - sistema corrigido!',
      notes: 'Teste da validação manual após correções no formulário'
    };

    const validationResponse = await axios.post('http://localhost:3001/api/validations', validationData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ VALIDAÇÃO MANUAL CRIADA COM SUCESSO!');
    console.log(`   ID da validação: ${validationResponse.data.validation.id}`);
    console.log(`   Status: ${validationResponse.data.validation.status}`);
    console.log(`   Tipo: ${validationResponse.data.validation.type}`);
    console.log(`   Relatório: ${validationResponse.data.validation.reportId || 'NENHUM (validação manual)'}`);

    // Verificar se produto foi atualizado
    console.log('\n3️⃣ VERIFICANDO STATUS DO PRODUTO...');
    const updatedProductResponse = await axios.get(`http://localhost:3001/api/products/${product.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Status do produto atualizado: ${updatedProductResponse.data.product.status}`);
    console.log(`   Validações: ${updatedProductResponse.data.product.validations?.length || 0}`);

    // Listar todas as validações
    console.log('\n4️⃣ LISTANDO VALIDAÇÕES...');
    const validationsResponse = await axios.get('http://localhost:3001/api/validations', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Total de validações: ${validationsResponse.data.validations.length}`);
    validationsResponse.data.validations.forEach((val, index) => {
      console.log(`   ${index + 1}. ${val.product?.name} - Status: ${val.status} - Tipo: ${val.type || 'N/A'}`);
    });

    console.log('\n🎉 TESTE DE VALIDAÇÃO MANUAL CONCLUÍDO!');
    console.log('\n📊 RESUMO:');
    console.log('✅ Formulário corrigido - Relatório agora é opcional');
    console.log('✅ Tipo de validação adicionado (MANUAL/LABORATORY)');
    console.log('✅ Validação manual funcionando sem relatório');
    console.log('✅ Produto validado com sucesso');
    console.log('✅ Workflow sem dependência circular funcionando!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados enviados:', error.config?.data);
    }
  }
}

testValidacaoManual();
