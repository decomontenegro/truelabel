const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLabRoles() {
  try {
    console.log('🔧 Corrigindo roles de usuários de laboratório...');
    
    // Atualizar usuários que deveriam ser LAB mas estão como BRAND
    const labUsers = [
      'lab@truelabel.com.br',
      'analista@labexemplo.com'
    ];
    
    for (const email of labUsers) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (user && user.role !== 'LAB') {
        await prisma.user.update({
          where: { email },
          data: { role: 'LAB' }
        });
        console.log(`✅ Atualizado: ${email} - Role alterada de ${user.role} para LAB`);
      } else if (user) {
        console.log(`✓ ${email} já está com role LAB`);
      } else {
        console.log(`⚠️ Usuário ${email} não encontrado`);
      }
    }
    
    // Listar todos os usuários e suas roles atuais
    console.log('\n📋 Lista de usuários atuais:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      },
      orderBy: { role: 'asc' }
    });
    
    allUsers.forEach(user => {
      console.log(`  ${user.role.padEnd(10)} - ${user.email} (${user.name})`);
    });
    
    console.log('\n✅ Correção de roles concluída!');
  } catch (error) {
    console.error('❌ Erro ao corrigir roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLabRoles();