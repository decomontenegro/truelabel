import fetch from 'node-fetch';

async function testAPILogin() {
  console.log('🔐 Testando login via API...\n');
  
  try {
    // Testar login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@truelabel.com.br',
        password: 'admin123'
      })
    });
    
    console.log('Status do login:', loginResponse.status);
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ Login bem-sucedido!');
      console.log('Token:', data.token ? 'Recebido' : 'Não recebido');
      console.log('Usuário:', data.user?.name || 'N/A');
      console.log('Email:', data.user?.email || 'N/A');
      console.log('Tipo:', data.user?.type || 'N/A');
      
      if (data.token) {
        // Testar acesso ao dashboard com o token
        console.log('\n📊 Testando acesso autenticado...');
        
        const dashboardResponse = await fetch('http://localhost:3000/api/products', {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        console.log('Status produtos:', dashboardResponse.status);
        
        if (dashboardResponse.ok) {
          const products = await dashboardResponse.json();
          console.log('✅ Acesso autorizado! Produtos:', products.length || 0);
        } else {
          console.log('❌ Acesso negado aos produtos');
        }
      }
      
    } else {
      console.log('❌ Login falhou');
      const error = await loginResponse.text();
      console.log('Erro:', error);
    }
    
    // Testar com credenciais alternativas
    console.log('\n🔑 Testando credenciais alternativas...\n');
    
    const credentials = [
      { email: 'admin@truelabel.com', password: 'admin123' },
      { email: 'brand@example.com', password: 'brand123' },
      { email: 'lab@example.com', password: 'lab123' }
    ];
    
    for (const cred of credentials) {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });
      
      console.log(`${cred.email}: ${response.status} ${response.ok ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testAPILogin();