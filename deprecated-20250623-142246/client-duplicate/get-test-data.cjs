// Script para obter dados de teste
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function getTestData() {
  try {
    // Fazer login como lab
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'analista@labexemplo.com',
      password: 'lab123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('👤 Usuário logado:', user);
    
    // Buscar produtos
    const productsResponse = await axios.get(`${API_URL}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n📦 Produtos disponíveis:');
    const products = Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data.products || [];
    products.slice(0, 3).forEach(product => {
      console.log(`  - ${product.name} (ID: ${product.id})`);
    });
    
    // Buscar laboratórios
    const labsResponse = await axios.get(`${API_URL}/laboratories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n🔬 Laboratórios disponíveis:');
    labsResponse.data.forEach(lab => {
      console.log(`  - ${lab.name} (ID: ${lab.id})`);
    });
    
    // Retornar dados para uso no teste
    return {
      token,
      userId: user.id,
      productId: products[0]?.id,
      laboratoryId: user.laboratoryId || labsResponse.data[0]?.id,
      user
    };
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    return null;
  }
}

// Executar e exibir dados
getTestData().then(data => {
  if (data) {
    console.log('\n✅ Dados para teste de upload:');
    console.log(`  productId: "${data.productId}"`);
    console.log(`  laboratoryId: "${data.laboratoryId}"`);
    console.log(`  analysisType: "NUTRITIONAL" | "MICROBIOLOGICAL" | "SENSORIAL"`);
  }
});