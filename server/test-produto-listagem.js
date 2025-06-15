const axios = require('axios');

async function testProdutoListagem() {
  console.log('🧪 TESTANDO LISTAGEM DE PRODUTOS APÓS CORREÇÕES\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado');

    // Listar todos os produtos
    console.log('\n1️⃣ LISTANDO TODOS OS PRODUTOS...');
    const allProductsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Total de produtos: ${allProductsResponse.data.products.length}`);
    allProductsResponse.data.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.brand}) - Status: ${product.status}`);
    });

    // Listar apenas produtos DRAFT
    console.log('\n2️⃣ LISTANDO PRODUTOS EM DRAFT...');
    const draftProductsResponse = await axios.get('http://localhost:3001/api/products?status=DRAFT', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Produtos em DRAFT: ${draftProductsResponse.data.products.length}`);
    draftProductsResponse.data.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.brand}) - Status: ${product.status}`);
    });

    // Criar um novo produto para testar
    console.log('\n3️⃣ CRIANDO NOVO PRODUTO PARA TESTE...');
    const newProductResponse = await axios.post('http://localhost:3001/api/products', {
      name: 'Produto Teste Listagem',
      brand: 'Marca Teste',
      category: 'Alimentos',
      sku: `TEST-LIST-${Date.now()}`,
      description: 'Produto para testar listagem',
      claims: 'Testado, Funcional, Aparece na Lista'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Novo produto criado: ${newProductResponse.data.product.name}`);
    console.log(`   Status: ${newProductResponse.data.product.status}`);
    console.log(`   ID: ${newProductResponse.data.product.id}`);

    // Verificar se aparece na listagem
    console.log('\n4️⃣ VERIFICANDO SE APARECE NA LISTAGEM...');
    const updatedProductsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const foundProduct = updatedProductsResponse.data.products.find(
      p => p.id === newProductResponse.data.product.id
    );
    
    if (foundProduct) {
      console.log('✅ PRODUTO ENCONTRADO NA LISTAGEM!');
      console.log(`   Nome: ${foundProduct.name}`);
      console.log(`   Status: ${foundProduct.status}`);
      console.log(`   Criado em: ${foundProduct.createdAt}`);
    } else {
      console.log('❌ Produto NÃO encontrado na listagem');
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('\n📊 RESUMO:');
    console.log(`✅ Total de produtos no sistema: ${updatedProductsResponse.data.products.length}`);
    console.log(`✅ Produtos em DRAFT: ${draftProductsResponse.data.products.length}`);
    console.log(`✅ Novo produto criado e ${foundProduct ? 'ENCONTRADO' : 'NÃO ENCONTRADO'} na listagem`);
    console.log('');
    console.log('🔧 CORREÇÕES APLICADAS:');
    console.log('✅ Status DRAFT adicionado aos filtros');
    console.log('✅ Funções de status atualizadas');
    console.log('✅ CSS para status DRAFT adicionado');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.response?.data || error.message);
  }
}

testProdutoListagem();
