// Script para criar produto de teste
const axios = require('axios');
const API_URL = 'http://localhost:3000/api';

async function createTestProduct() {
  try {
    // Fazer login como marca (brand)
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'marca@exemplo.com',
      password: 'brand123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado como marca');
    
    // Criar produto de teste
    const productData = {
      name: 'Produto Teste Upload',
      description: 'Produto criado para testes de upload de relatórios',
      sku: 'TEST-UPLOAD-001',
      barcode: '7891234567890',
      category: 'FOOD',
      manufacturer: 'Empresa Teste',
      certifications: []
    };
    
    const productResponse = await axios.post(`${API_URL}/products`, productData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n✅ Produto criado:');
    console.log(`  Nome: ${productResponse.data.name}`);
    console.log(`  ID: ${productResponse.data.id}`);
    console.log(`  SKU: ${productResponse.data.sku}`);
    
    return productResponse.data;
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Produto já existe, buscando...');
      
      // Buscar produto existente
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'marca@exemplo.com',
        password: 'brand123'
      });
      
      const searchResponse = await axios.get(`${API_URL}/products?search=TEST-UPLOAD-001`, {
        headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
      });
      
      const products = Array.isArray(searchResponse.data) ? searchResponse.data : searchResponse.data.products || [];
      const product = products.find(p => p.sku === 'TEST-UPLOAD-001');
      
      if (product) {
        console.log('\n✅ Produto encontrado:');
        console.log(`  Nome: ${product.name}`);
        console.log(`  ID: ${product.id}`);
        console.log(`  SKU: ${product.sku}`);
        return product;
      }
    }
    
    console.error('❌ Erro:', error.response?.data || error.message);
    return null;
  }
}

// Executar
createTestProduct();