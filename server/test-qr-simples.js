const axios = require('axios');

async function testQRSimples() {
  console.log('🧪 TESTE SIMPLES - QR CODE API\n');

  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@truelabel.com',
      password: '123456'
    });
    const authToken = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login realizado');
    console.log(`   Usuário: ${user.name} (${user.role})`);

    // Buscar produtos
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ ${productsResponse.data.products.length} produtos encontrados`);
    
    if (productsResponse.data.products.length > 0) {
      const product = productsResponse.data.products[0];
      console.log(`   Testando com: ${product.name} (Owner: ${product.userId})`);
      console.log(`   Admin ID: ${user.id}`);
      
      // Tentar gerar QR Code
      console.log('\n1️⃣ TENTANDO GERAR QR CODE...');
      try {
        const qrResponse = await axios.post('http://localhost:3001/api/qr/generate', {
          productId: product.id
        }, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ QR Code gerado com sucesso!');
        console.log(`   Código: ${qrResponse.data.qrCode}`);
        console.log(`   URL: ${qrResponse.data.validationUrl}`);
        
      } catch (qrError) {
        console.log('❌ Erro ao gerar QR Code:', qrError.response?.data);
        console.log('   Status:', qrError.response?.status);
        
        // Verificar se é problema de permissão
        if (qrError.response?.status === 404) {
          console.log('\n🔍 INVESTIGANDO PROBLEMA...');
          console.log('   Produto existe na listagem mas não é encontrado na geração');
          console.log('   Possível problema de permissão ou filtro');
        }
      }
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error.response?.data || error.message);
  }
}

testQRSimples();
