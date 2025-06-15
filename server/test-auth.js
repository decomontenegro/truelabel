const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAuth() {
  try {
    console.log('🧪 Testando sistema de autenticação...');

    // 1. Registrar um usuário
    console.log('\n1. Registrando usuário...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: 'teste@exemplo.com',
      password: 'senha123',
      name: 'Usuário Teste',
      role: 'BRAND'
    });

    console.log('✅ Usuário registrado:', registerResponse.data);
    const token = registerResponse.data.data.token;

    // 2. Fazer login
    console.log('\n2. Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'teste@exemplo.com',
      password: 'senha123'
    });

    console.log('✅ Login realizado:', loginResponse.data);

    // 3. Verificar token
    console.log('\n3. Verificando token...');
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Token válido:', meResponse.data);

    // 4. Testar acesso a rota protegida
    console.log('\n4. Testando rota protegida...');
    const productsResponse = await axios.get(`${BASE_URL}/api/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Acesso autorizado aos produtos:', productsResponse.data);

    console.log('\n🎉 Todos os testes de autenticação passaram!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Verificar se axios está disponível
try {
  testAuth();
} catch (error) {
  console.log('📦 Instalando axios...');
  const { exec } = require('child_process');
  exec('npm install axios', (error, stdout, stderr) => {
    if (error) {
      console.error('Erro ao instalar axios:', error);
      return;
    }
    console.log('✅ Axios instalado, executando testes...');
    testAuth();
  });
}
