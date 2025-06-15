import { swaggerSpec } from './src/config/swagger';
import fs from 'fs';
import path from 'path';

/**
 * Script para gerar a documentação da API em formato JSON
 * Útil para importar em ferramentas como Postman ou Insomnia
 */

const outputPath = path.join(__dirname, 'api-documentation.json');

try {
  // Gerar arquivo JSON com a especificação
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  
  console.log('✅ Documentação da API gerada com sucesso!');
  console.log(`📄 Arquivo salvo em: ${outputPath}`);
  console.log('\n📌 Como usar:');
  console.log('1. Acesse http://localhost:3000/api-docs para visualizar a documentação interativa');
  console.log('2. Importe o arquivo api-documentation.json no Postman ou Insomnia');
  console.log('3. Use a URL base: http://localhost:3000/api');
  
  // Listar todos os endpoints documentados
  const paths = Object.keys(swaggerSpec.paths || {});
  if (paths.length > 0) {
    console.log('\n📋 Endpoints documentados:');
    paths.forEach(path => {
      const methods = Object.keys(swaggerSpec.paths[path]);
      methods.forEach(method => {
        const endpoint = swaggerSpec.paths[path][method];
        console.log(`   ${method.toUpperCase()} ${path} - ${endpoint.summary || 'Sem descrição'}`);
      });
    });
  }
} catch (error) {
  console.error('❌ Erro ao gerar documentação:', error);
  process.exit(1);
}