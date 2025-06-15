import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugLogin() {
  try {
    console.log('🔍 Debug de Login\n');
    
    // 1. Verificar usuários no banco
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });
    
    console.log(`📊 Total de usuários: ${users.length}\n`);
    
    for (const user of users) {
      console.log(`Usuário: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Nome: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Hash: ${user.password.substring(0, 20)}...`);
      
      // Testar senha
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`  Senha '${testPassword}' válida? ${isValid ? '✅' : '❌'}`);
      
      // Gerar novo hash para comparação
      if (!isValid) {
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`  Novo hash seria: ${newHash.substring(0, 20)}...`);
      }
      
      console.log('');
    }
    
    // 2. Criar/atualizar usuário admin com senha conhecida
    console.log('🔧 Atualizando senha do admin...');
    
    const newPassword = await bcrypt.hash('admin123', 10);
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@truelabel.com' },
      data: { password: newPassword }
    });
    
    console.log('✅ Senha do admin atualizada!');
    
    // 3. Verificar novamente
    const isValidNow = await bcrypt.compare('admin123', updatedAdmin.password);
    console.log(`Verificação final: ${isValidNow ? '✅ Senha válida' : '❌ Senha inválida'}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();