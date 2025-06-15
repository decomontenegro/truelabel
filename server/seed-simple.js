const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar usuário admin
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cpgvalidation.com' },
      update: {},
      create: {
        email: 'admin@cpgvalidation.com',
        password: adminPassword,
        name: 'Administrador',
        role: 'ADMIN',
      },
    });

    console.log('✅ Usuário admin criado:', admin.email);

    // Criar laboratório de exemplo
    const lab1 = await prisma.laboratory.upsert({
      where: { email: 'contato@labexemplo.com' },
      update: {},
      create: {
        name: 'Laboratório Exemplo',
        accreditation: 'ISO/IEC 17025:2017',
        email: 'contato@labexemplo.com',
        phone: '(11) 1234-5678',
        address: 'Rua das Análises, 123 - São Paulo, SP',
        isActive: true,
      },
    });

    console.log('✅ Laboratório criado:', lab1.name);

    // Criar usuário de marca de exemplo
    const brandPassword = await bcrypt.hash('brand123', 12);
    const brand = await prisma.user.upsert({
      where: { email: 'marca@exemplo.com' },
      update: {},
      create: {
        email: 'marca@exemplo.com',
        password: brandPassword,
        name: 'Marca Exemplo',
        role: 'BRAND',
      },
    });

    console.log('✅ Usuário de marca criado:', brand.email);

    // Criar produto de exemplo
    const product1 = await prisma.product.upsert({
      where: { sku: 'IOG001' },
      update: {},
      create: {
        name: 'Iogurte Grego Natural',
        brand: 'Marca Exemplo',
        category: 'Alimentos',
        description: 'Iogurte grego natural rico em proteínas',
        sku: 'IOG001',
        batchNumber: 'L20240101',
        claims: ['Fonte de Proteína', 'Sem Lactose'],
        nutritionalInfo: {
          porcao: '100g',
          calorias: 120,
          proteinas: '10g',
          carboidratos: '8g',
          gorduras: '5g'
        },
        status: 'PENDING',
        userId: brand.id,
      },
    });

    console.log('✅ Produto criado:', product1.name);

    console.log('🎉 Seed concluído com sucesso!');
    console.log('');
    console.log('👤 Credenciais de acesso:');
    console.log('Admin: admin@cpgvalidation.com / admin123');
    console.log('Marca: marca@exemplo.com / brand123');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
