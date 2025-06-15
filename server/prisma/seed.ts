import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

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

  // Criar laboratórios de exemplo
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

  const lab2 = await prisma.laboratory.upsert({
    where: { email: 'lab@qualidade.com' },
    update: {},
    create: {
      name: 'Laboratório Qualidade Total',
      accreditation: 'ISO/IEC 17025:2017, INMETRO',
      email: 'lab@qualidade.com',
      phone: '(21) 9876-5432',
      address: 'Av. da Ciência, 456 - Rio de Janeiro, RJ',
      isActive: true,
    },
  });

  console.log('✅ Laboratórios criados:', lab1.name, lab2.name);

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

  // Criar produtos de exemplo
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
      claims: 'Fonte de Proteína, Sem Lactose',
      nutritionalInfo: JSON.stringify({
        porcao: '100g',
        calorias: 120,
        proteinas: '10g',
        carboidratos: '8g',
        gorduras: '5g'
      }),
      status: 'PENDING',
      userId: brand.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'SUP001' },
    update: {},
    create: {
      name: 'Suplemento Pré-Treino',
      brand: 'Marca Exemplo',
      category: 'Suplementos',
      description: 'Suplemento pré-treino sem glúten',
      sku: 'SUP001',
      batchNumber: 'L20240102',
      claims: 'Sem Glúten, Fonte de Energia',
      nutritionalInfo: JSON.stringify({
        porcao: '10g',
        calorias: 35,
        proteinas: '2g',
        carboidratos: '7g',
        cafeina: '200mg'
      }),
      status: 'PENDING',
      userId: brand.id,
    },
  });

  console.log('✅ Produtos criados:', product1.name, product2.name);

  // Criar usuário de laboratório
  const labPassword = await bcrypt.hash('lab123', 12);
  const labUser = await prisma.user.upsert({
    where: { email: 'analista@labexemplo.com' },
    update: {},
    create: {
      email: 'analista@labexemplo.com',
      password: labPassword,
      name: 'Analista Laboratório',
      role: 'LAB',
    },
  });

  console.log('✅ Usuário de laboratório criado:', labUser.email);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('👤 Credenciais de acesso:');
  console.log('Admin: admin@cpgvalidation.com / admin123');
  console.log('Marca: marca@exemplo.com / brand123');
  console.log('Lab: analista@labexemplo.com / lab123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
