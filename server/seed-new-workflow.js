const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 CRIANDO DADOS PARA NOVO WORKFLOW (SEM DEPENDÊNCIA CIRCULAR)\n');

  try {
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

    const brandUser = await prisma.user.create({
      data: {
        email: 'marca@exemplo.com',
        password: hashedPassword,
        name: 'Marca Exemplo Ltda',
        role: 'BRAND',
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

    // CENÁRIO 1: Produto em DRAFT
    const product1 = await prisma.product.create({
      data: {
        name: 'Whey Protein Premium',
        brand: 'FitNutri',
        category: 'Suplementos',
        description: 'Whey protein isolado',
        sku: 'FN-WP-001',
        claims: 'Fonte de Proteína, Sem Lactose',
        status: 'DRAFT',
        userId: brandUser.id,
      },
    });

    // CENÁRIO 2: Produto PENDING
    const product2 = await prisma.product.create({
      data: {
        name: 'Barra de Cereal Integral',
        brand: 'NutriBar',
        category: 'Alimentos',
        description: 'Barra de cereal integral',
        sku: 'NB-BC-002',
        claims: 'Fonte de Fibras, Integral',
        status: 'PENDING',
        userId: brandUser.id,
      },
    });

    console.log('✅ Produtos criados');

    // CENÁRIO 3: Validação MANUAL
    const validation1 = await prisma.validation.create({
      data: {
        status: 'APPROVED',
        type: 'MANUAL',
        claimsValidated: '{"Fonte de Fibras": {"status": "approved"}}',
        summary: 'Produto aprovado em validação manual.',
        validatedAt: new Date(),
        productId: product2.id,
        userId: adminUser.id,
      },
    });

    await prisma.product.update({
      where: { id: product2.id },
      data: { status: 'VALIDATED' }
    });

    console.log('✅ Validação manual criada');

    console.log('\n🎉 NOVO WORKFLOW CRIADO COM SUCESSO!');
    console.log('🔄 WORKFLOW SEM DEPENDÊNCIA CIRCULAR FUNCIONANDO!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
