const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  await prisma.qRCodeAccess.deleteMany();
  await prisma.validation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.product.deleteMany();
  await prisma.laboratory.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuários
  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@truelabel.com',
      password: hashedPassword,
      name: 'Administrador True Label',
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuários criados');

  // Criar laboratório
  const laboratory = await prisma.laboratory.create({
    data: {
      name: 'Laboratório de Análises Nutricionais LTDA',
      accreditation: 'ISO/IEC 17025:2017',
      email: 'contato@labnutri.com.br',
      phone: '+55 11 1234-5678',
      address: 'Rua das Análises, 123 - São Paulo, SP',
      isActive: true,
    },
  });

  console.log('✅ Laboratório criado');

  console.log('🎉 Seed concluído com sucesso!');
  
  console.log('\n🔑 Credenciais de acesso:');
  console.log('Admin: admin@truelabel.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
