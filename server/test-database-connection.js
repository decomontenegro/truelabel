const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testando conexão com o banco de dados Supabase...\n');

// Configurar a URL diretamente para o teste
process.env.DATABASE_URL = "postgresql://postgres:truelabel123456@db.japmwgubsutskpotfayx.supabase.co:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    // Teste 1: Conexão básica
    console.log('1️⃣ Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Teste 2: Contar usuários
    console.log('2️⃣ Verificando usuários...');
    const userCount = await prisma.user.count();
    console.log(`✅ Encontrados ${userCount} usuários no banco\n`);

    // Teste 3: Listar usuários
    console.log('3️⃣ Listando usuários:');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    });
    
    users.forEach(user => {
      console.log(`   - ${user.role}: ${user.email} (${user.name})`);
    });

    // Teste 4: Verificar laboratórios
    console.log('\n4️⃣ Verificando laboratórios...');
    const labCount = await prisma.laboratory.count();
    console.log(`✅ Encontrados ${labCount} laboratórios no banco\n`);

    // Teste 5: Verificar produtos
    console.log('5️⃣ Verificando produtos...');
    const productCount = await prisma.product.count();
    console.log(`✅ Encontrados ${productCount} produtos no banco\n`);

    console.log('🎉 SUCESSO! Banco de dados está funcionando corretamente!');
    console.log('\n📋 Resumo:');
    console.log(`   - Usuários: ${userCount}`);
    console.log(`   - Laboratórios: ${labCount}`);
    console.log(`   - Produtos: ${productCount}`);
    
    console.log('\n🔐 Logins disponíveis:');
    console.log('   - admin@truelabel.com / admin123');
    console.log('   - brand@truelabel.com.br / brand123');
    console.log('   - analista@labexemplo.com / lab123');

  } catch (error) {
    console.error('❌ ERRO ao conectar com o banco:', error.message);
    
    if (error.message.includes("Can't reach database")) {
      console.log('\n💡 Possíveis soluções:');
      console.log('   1. Verifique se o projeto Supabase está ativo');
      console.log('   2. Confirme se a senha está correta');
      console.log('   3. Tente usar a connection string com pooling (porta 6543)');
      console.log('   4. Execute o SQL diretamente no Supabase SQL Editor');
    } else if (error.message.includes('relation "User" does not exist')) {
      console.log('\n💡 As tabelas não foram criadas ainda!');
      console.log('   1. Vá no Supabase SQL Editor');
      console.log('   2. Cole e execute o SQL do arquivo supabase-direct-setup.sql');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();