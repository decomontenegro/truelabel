// Script para debugar qual URL da API está sendo usada
console.log('🔍 DEBUGGING API URL CONFIGURATION');
console.log('=====================================');

// Verificar variáveis de ambiente
console.log('1. Environment Variables:');
console.log('   VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('   MODE:', import.meta.env.MODE);
console.log('   DEV:', import.meta.env.DEV);
console.log('   PROD:', import.meta.env.PROD);

// Verificar configuração do axios
import config from './src/config/env.js';
console.log('\n2. Config Object:');
console.log('   apiUrl:', config.apiUrl);
console.log('   isDevelopment:', config.isDevelopment);
console.log('   isProduction:', config.isProduction);

// Verificar instância do axios
import { api } from './src/services/api.js';
console.log('\n3. Axios Instance:');
console.log('   baseURL:', api.defaults.baseURL);
console.log('   timeout:', api.defaults.timeout);

// Testar uma requisição
console.log('\n4. Testing API Request:');
try {
  const response = await api.get('/health');
  console.log('   ✅ API Health Check Success:', response.data);
} catch (error) {
  console.log('   ❌ API Health Check Failed:', error.message);
  console.log('   Request URL:', error.config?.url);
  console.log('   Base URL:', error.config?.baseURL);
}

console.log('\n=====================================');
