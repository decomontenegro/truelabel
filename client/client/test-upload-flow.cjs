// Script de teste para upload e validação
const API_URL = 'http://localhost:3000/api';
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

// Credenciais de teste
const credentials = [
  { email: 'lab@truelabel.com.br', password: 'lab123', name: 'Lab TrueLabel' },
  { email: 'analista@labexemplo.com', password: 'lab123', name: 'Lab Exemplo' }
];

// Arquivos de teste
const testFiles = [
  { path: './test-files/relatorio-teste.pdf', type: 'application/pdf', valid: true },
  { path: './test-files/relatorio-teste.png', type: 'image/png', valid: true },
  { path: './test-files/relatorio-teste.jpg', type: 'image/jpeg', valid: true },
  { path: './test-files/relatorio-teste.txt', type: 'text/plain', valid: true },
  { path: './test-files/teste-invalido.exe', type: 'application/x-msdownload', valid: false },
  { path: './test-files/relatorio-grande.txt', type: 'text/plain', valid: true, large: true }
];

async function login(email, password) {
  try {
    console.log(`\n🔐 Tentando login com: ${email}`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    console.log(`✅ Login bem-sucedido: ${response.data.user.name} (${response.data.user.role})`);
    return response.data.token;
  } catch (error) {
    console.log(`❌ Erro no login: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testFileUpload(token, filePath, fileType) {
  try {
    console.log(`\n📤 Testando upload de: ${path.basename(filePath)} (${fileType})`);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: fileType
    });
    form.append('productId', '1'); // ID de produto de teste
    
    const response = await axios.post(`${API_URL}/upload/reports`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log(`✅ Upload bem-sucedido:`, response.data);
    return response.data;
  } catch (error) {
    console.log(`❌ Erro no upload: ${error.response?.data?.error || error.message}`);
    if (error.response?.data?.details) {
      console.log(`   Detalhes:`, error.response.data.details);
    }
    return null;
  }
}

async function getValidationQueue(token) {
  try {
    console.log(`\n📋 Verificando fila de validação...`);
    const response = await axios.get(`${API_URL}/validations/queue`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ Validações na fila: ${response.data.length}`);
    return response.data;
  } catch (error) {
    console.log(`❌ Erro ao buscar fila: ${error.response?.data?.error || error.message}`);
    return [];
  }
}

async function getReportParser(token, reportId) {
  try {
    console.log(`\n🔍 Testando parser do relatório ID: ${reportId}`);
    const response = await axios.get(`${API_URL}/reports/${reportId}/parse`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ Dados extraídos:`, response.data);
    return response.data;
  } catch (error) {
    console.log(`❌ Erro no parser: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de upload e validação...\n');
  
  // Testar cada credencial
  for (const cred of credentials) {
    const token = await login(cred.email, cred.password);
    
    if (token) {
      console.log('\n' + '='.repeat(60));
      console.log(`📝 TESTES PARA: ${cred.name}`);
      console.log('='.repeat(60));
      
      // Testar upload de cada arquivo
      const uploadedReports = [];
      for (const file of testFiles) {
        if (fs.existsSync(file.path)) {
          const result = await testFileUpload(token, file.path, file.type);
          if (result) {
            uploadedReports.push(result);
          }
        } else {
          console.log(`⚠️  Arquivo não encontrado: ${file.path}`);
        }
      }
      
      // Verificar fila de validação
      const queue = await getValidationQueue(token);
      
      // Testar parser em alguns relatórios
      for (const report of uploadedReports.slice(0, 3)) {
        if (report.id) {
          await getReportParser(token, report.id);
        }
      }
      
      // Resumo
      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMO DOS TESTES:');
      console.log(`   - Uploads bem-sucedidos: ${uploadedReports.length}`);
      console.log(`   - Validações na fila: ${queue.length}`);
      console.log('='.repeat(60));
    }
  }
  
  console.log('\n✅ Testes concluídos!');
}

// Executar testes
runTests().catch(console.error);