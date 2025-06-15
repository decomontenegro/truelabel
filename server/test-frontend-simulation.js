const axios = require('axios');

async function testFrontendSimulation() {
  console.log('🧪 SIMULANDO EXATAMENTE O QUE O FRONTEND FAZ\n');

  try {
    // Login (igual ao frontend)
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // Buscar produtos (igual ao frontend)
    console.log('\n1️⃣ BUSCANDO PRODUTOS...');
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ ${productsResponse.data.products.length} produtos encontrados`);

    // Buscar relatórios (igual ao frontend)
    console.log('\n2️⃣ BUSCANDO RELATÓRIOS...');
    try {
      const reportsResponse = await axios.get('http://localhost:3001/api/reports', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ ${reportsResponse.data.reports?.length || 0} relatórios encontrados`);
    } catch (error) {
      console.log(`⚠️ Erro ao buscar relatórios: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // Simular dados do formulário (exatamente como no frontend)
    const formData = {
      productId: productsResponse.data.products.find(p => p.status === 'DRAFT')?.id || productsResponse.data.products[0]?.id,
      reportId: '',
      type: 'MANUAL',
      status: 'APPROVED',
      claimsValidated: {},
      summary: 'dadad',
      notes: ''
    };

    console.log('\n3️⃣ DADOS DO FORMULÁRIO:');
    console.log(JSON.stringify(formData, null, 2));

    // Simular validação do frontend
    console.log('\n4️⃣ SIMULANDO VALIDAÇÃO DO FRONTEND...');
    const validationData = {
      ...formData,
      claimsValidated: formData.claimsValidated || {}
    };

    console.log('Dados finais enviados:');
    console.log(JSON.stringify(validationData, null, 2));

    // Criar validação (igual ao frontend)
    console.log('\n5️⃣ CRIANDO VALIDAÇÃO...');
    const validationResponse = await axios.post('http://localhost:3001/api/validations', validationData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ VALIDAÇÃO CRIADA COM SUCESSO!');
    console.log(`   ID: ${validationResponse.data.validation.id}`);
    console.log(`   Status: ${validationResponse.data.validation.status}`);

    console.log('\n🎉 SIMULAÇÃO FRONTEND CONCLUÍDA COM SUCESSO!');
    console.log('✅ O problema NÃO está na API');
    console.log('✅ O problema deve estar no frontend (interface/toast/logs)');

  } catch (error) {
    console.error('❌ ERRO NA SIMULAÇÃO:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testFrontendSimulation();
