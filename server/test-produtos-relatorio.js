const axios = require('axios');

async function testProdutosRelatorio() {
  console.log('🧪 TESTANDO CARREGAMENTO DE PRODUTOS PARA RELATÓRIO\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // Testar carregamento de produtos (igual ao frontend)
    console.log('\n1️⃣ CARREGANDO PRODUTOS (igual ao frontend)...');
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Total de produtos retornados: ${productsResponse.data.products.length}`);
    
    if (productsResponse.data.products.length === 0) {
      console.log('❌ NENHUM PRODUTO ENCONTRADO!');
      console.log('   Isso explica por que o select está vazio');
    } else {
      console.log('\n📋 PRODUTOS ENCONTRADOS:');
      productsResponse.data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.brand})`);
        console.log(`      Status: ${product.status}`);
        console.log(`      ID: ${product.id}`);
        console.log(`      Owner: ${product.userId || 'N/A'}`);
        console.log('');
      });
    }

    // Testar carregamento de laboratórios
    console.log('\n2️⃣ CARREGANDO LABORATÓRIOS...');
    try {
      const labsResponse = await axios.get('http://localhost:3001/api/laboratories', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ Total de laboratórios: ${labsResponse.data.laboratories?.length || 0}`);
      
      if (labsResponse.data.laboratories?.length > 0) {
        console.log('\n🏥 LABORATÓRIOS ENCONTRADOS:');
        labsResponse.data.laboratories.forEach((lab, index) => {
          console.log(`   ${index + 1}. ${lab.name} - ${lab.accreditation}`);
        });
      }
    } catch (error) {
      console.log(`❌ Erro ao carregar laboratórios: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // Verificar produtos por status específico
    console.log('\n3️⃣ VERIFICANDO PRODUTOS POR STATUS...');
    const statuses = ['DRAFT', 'PENDING', 'VALIDATED', 'REJECTED'];
    
    for (const status of statuses) {
      try {
        const statusResponse = await axios.get(`http://localhost:3001/api/products?status=${status}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(`   ${status}: ${statusResponse.data.products.length} produtos`);
      } catch (error) {
        console.log(`   ${status}: Erro - ${error.response?.data?.error}`);
      }
    }

    console.log('\n🎯 DIAGNÓSTICO:');
    if (productsResponse.data.products.length === 0) {
      console.log('❌ PROBLEMA: Nenhum produto está sendo retornado pela API');
      console.log('   Isso explica por que o select de produtos está vazio');
      console.log('   Possíveis causas:');
      console.log('   - Filtros de permissão muito restritivos');
      console.log('   - Produtos não estão sendo salvos corretamente');
      console.log('   - Problema na query do banco de dados');
    } else {
      console.log('✅ PRODUTOS ENCONTRADOS: O problema pode estar no frontend');
      console.log('   Verifique se o componente está renderizando corretamente');
    }

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message);
  }
}

testProdutosRelatorio();
