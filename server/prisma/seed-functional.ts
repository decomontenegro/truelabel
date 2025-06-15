import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed funcional...');

  try {
    // Limpar dados existentes
    await prisma.qRCodeAccess.deleteMany();
    await prisma.validation.deleteMany();
    await prisma.report.deleteMany();
    await prisma.product.deleteMany();
    await prisma.laboratory.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Dados anteriores limpos');

    // 1. Criar usuários
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@truelabel.com',
        password: adminPassword,
        name: 'Administrador True Label',
        role: 'ADMIN',
      },
    });

    const brandPassword = await bcrypt.hash('marca123', 12);
    const brand = await prisma.user.create({
      data: {
        email: 'marca@exemplo.com',
        password: brandPassword,
        name: 'Marca Exemplo Ltda',
        role: 'BRAND',
      },
    });

    const labPassword = await bcrypt.hash('lab123', 12);
    const labUser = await prisma.user.create({
      data: {
        email: 'analista@labexemplo.com',
        password: labPassword,
        name: 'Dr. João Silva',
        role: 'LAB',
      },
    });

    const validatorPassword = await bcrypt.hash('validator123', 12);
    const validator = await prisma.user.create({
      data: {
        email: 'validador@truelabel.com',
        password: validatorPassword,
        name: 'Dr. Maria Santos',
        role: 'ADMIN', // Validadores são admins
      },
    });

    console.log('✅ Usuários criados');

    // 2. Criar laboratórios
    const lab1 = await prisma.laboratory.create({
      data: {
        name: 'Lab Análises Científicas',
        accreditation: 'ISO/IEC 17025:2017',
        email: 'contato@labanalises.com',
        phone: '(11) 1234-5678',
        address: 'Rua das Análises, 123 - São Paulo, SP',
        isActive: true,
      },
    });

    const lab2 = await prisma.laboratory.create({
      data: {
        name: 'Instituto de Pesquisas Nutricionais',
        accreditation: 'ISO/IEC 17025:2017',
        email: 'contato@ipn.com.br',
        phone: '(11) 9876-5432',
        address: 'Av. Nutrição, 456 - São Paulo, SP',
        isActive: true,
      },
    });

    console.log('✅ Laboratórios criados');

    // 3. Criar produtos
    const product1 = await prisma.product.create({
      data: {
        name: 'Whey Protein Premium',
        brand: 'Marca Exemplo',
        category: 'Suplementos',
        description: 'Whey protein isolado de alta qualidade',
        sku: 'WP001',
        batchNumber: 'L20241201',
        nutritionalInfo: JSON.stringify({
          porcao: '30g',
          calorias: 120,
          proteinas: '25g',
          carboidratos: '2g',
          gorduras: '1g'
        }),
        claims: 'Rico em Proteína,Fonte de BCAA,Sem Lactose',
        status: 'PENDING',
        userId: brand.id,
      },
    });

    const product2 = await prisma.product.create({
      data: {
        name: 'Iogurte Grego Natural',
        brand: 'Marca Exemplo',
        category: 'Alimentos',
        description: 'Iogurte grego natural rico em probióticos',
        sku: 'IG001',
        batchNumber: 'L20241202',
        nutritionalInfo: JSON.stringify({
          porcao: '100g',
          calorias: 100,
          proteinas: '10g',
          carboidratos: '8g',
          gorduras: '5g'
        }),
        claims: 'Fonte de Probióticos,Rico em Proteína',
        status: 'VALIDATED',
        qrCode: 'QR001-IOGURTE-GREGO',
        userId: brand.id,
      },
    });

    const product3 = await prisma.product.create({
      data: {
        name: 'Pão Integral Sem Glúten',
        brand: 'Marca Exemplo',
        category: 'Alimentos',
        description: 'Pão integral livre de glúten',
        sku: 'PI001',
        batchNumber: 'L20241203',
        nutritionalInfo: JSON.stringify({
          porcao: '50g',
          calorias: 120,
          proteinas: '4g',
          carboidratos: '22g',
          gorduras: '2g'
        }),
        claims: 'Sem Glúten,Fonte de Fibras',
        status: 'VALIDATED',
        qrCode: 'QR002-PAO-INTEGRAL',
        userId: brand.id,
      },
    });

    console.log('✅ Produtos criados');

    // 4. Criar relatórios
    const report1 = await prisma.report.create({
      data: {
        fileName: 'laudo_whey_protein.pdf',
        originalName: 'Laudo Whey Protein Premium.pdf',
        filePath: '/uploads/reports/laudo_whey_protein.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        analysisType: 'nutritional',
        results: JSON.stringify({
          proteina: { valor: 25.3, unidade: 'g', metodo: 'AOAC 2001.11' },
          bcaa: { valor: 5.8, unidade: 'g', metodo: 'HPLC' },
          lactose: { valor: 0.01, unidade: 'g', metodo: 'HPLC' }
        }),
        isVerified: true,
        verificationHash: 'abc123def456',
        productId: product1.id,
        laboratoryId: lab1.id,
      },
    });

    const report2 = await prisma.report.create({
      data: {
        fileName: 'laudo_iogurte_grego.pdf',
        originalName: 'Laudo Iogurte Grego.pdf',
        filePath: '/uploads/reports/laudo_iogurte_grego.pdf',
        fileSize: 856000,
        mimeType: 'application/pdf',
        analysisType: 'microbiological',
        results: JSON.stringify({
          probioticos: { valor: 1000000000, unidade: 'UFC/ml', metodo: 'ISO 20128' },
          proteina: { valor: 10.2, unidade: 'g', metodo: 'AOAC 2001.11' }
        }),
        isVerified: true,
        verificationHash: 'def456ghi789',
        productId: product2.id,
        laboratoryId: lab2.id,
      },
    });

    console.log('✅ Relatórios criados');

    // 5. Criar validações
    const validation1 = await prisma.validation.create({
      data: {
        status: 'APPROVED',
        claimsValidated: JSON.stringify({
          'Rico em Proteína': { aprovado: true, observacao: 'Valor confirmado: 25.3g' },
          'Fonte de BCAA': { aprovado: true, observacao: 'Perfil adequado de aminoácidos' },
          'Sem Lactose': { aprovado: true, observacao: 'Abaixo do limite regulatório' }
        }),
        summary: 'Todos os claims foram validados cientificamente',
        validatedAt: new Date(),
        productId: product2.id,
        reportId: report2.id,
        userId: validator.id,
      },
    });

    const validation2 = await prisma.validation.create({
      data: {
        status: 'APPROVED',
        claimsValidated: JSON.stringify({
          'Fonte de Probióticos': { aprovado: true, observacao: 'Contagem adequada de UFC' },
          'Rico em Proteína': { aprovado: true, observacao: 'Valor confirmado: 10.2g' }
        }),
        summary: 'Claims probióticos e proteicos validados',
        validatedAt: new Date(),
        productId: product3.id,
        reportId: report1.id,
        userId: validator.id,
      },
    });

    console.log('✅ Validações criadas');

    // 6. Simular acessos aos QR Codes
    await prisma.qRCodeAccess.createMany({
      data: [
        {
          qrCode: 'QR001-IOGURTE-GREGO',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          location: 'São Paulo, SP',
        },
        {
          qrCode: 'QR002-PAO-INTEGRAL',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Android 12; Mobile)',
          location: 'Rio de Janeiro, RJ',
        },
        {
          qrCode: 'QR001-IOGURTE-GREGO',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          location: 'Belo Horizonte, MG',
        },
      ],
    });

    console.log('✅ Acessos QR Code simulados');

    console.log('\n🎉 Seed funcional concluído com sucesso!');
    console.log('\n👤 Credenciais de acesso:');
    console.log('Admin: admin@truelabel.com / admin123');
    console.log('Marca: marca@exemplo.com / marca123');
    console.log('Lab: analista@labexemplo.com / lab123');
    console.log('Validador: validador@truelabel.com / validator123');

    console.log('\n📊 Dados criados:');
    console.log('- 4 usuários (admin, marca, lab, validador)');
    console.log('- 2 laboratórios certificados');
    console.log('- 3 produtos (1 pendente, 2 validados)');
    console.log('- 2 relatórios laboratoriais');
    console.log('- 2 validações aprovadas');
    console.log('- 3 acessos QR Code simulados');

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
