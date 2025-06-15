import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de teste para QR Codes...');

  // Criar usuário brand para testes
  const brandPassword = await bcrypt.hash('brand123', 10);
  const brand = await prisma.user.upsert({
    where: { email: 'brand@truelabel.com.br' },
    update: { password: brandPassword },
    create: {
      email: 'brand@truelabel.com.br',
      password: brandPassword,
      name: 'Brand True Label',
      role: 'BRAND',
    },
  });

  console.log('✅ Usuário brand criado:', brand.email);

  // Criar laboratório
  const lab = await prisma.laboratory.upsert({
    where: { email: 'lab@truelabel.com.br' },
    update: {},
    create: {
      name: 'True Label Lab',
      accreditation: 'ISO/IEC 17025:2017',
      email: 'lab@truelabel.com.br',
      phone: '(11) 1234-5678',
      address: 'Rua das Análises, 123 - São Paulo, SP',
      isActive: true,
    },
  });

  console.log('✅ Laboratório criado:', lab.name);

  // Criar produtos para teste
  const products = [
    {
      name: 'Produto Validado com QR',
      sku: 'PRD-VAL-001',
      status: 'VALIDATED' as const,
      qrCode: 'a1b2c3d4e5f6g7h8',
    },
    {
      name: 'Produto Validado sem QR',
      sku: 'PRD-VAL-002',
      status: 'VALIDATED' as const,
      qrCode: null,
    },
    {
      name: 'Produto Pendente',
      sku: 'PRD-PEN-001',
      status: 'PENDING' as const,
      qrCode: null,
    },
    {
      name: 'Produto Rejeitado',
      sku: 'PRD-REJ-001',
      status: 'REJECTED' as const,
      qrCode: null,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: {
        name: productData.name,
        brand: 'True Label Brand',
        category: 'Alimentos',
        description: `Descrição do ${productData.name}`,
        sku: productData.sku,
        batchNumber: 'BATCH-2024-001',
        claims: 'Orgânico, Sem Glúten, Vegano',
        nutritionalInfo: JSON.stringify({
          porcao: '100g',
          calorias: 120,
          proteinas: '5g',
          carboidratos: '20g',
          gorduras: '3g'
        }),
        status: productData.status,
        qrCode: productData.qrCode,
        userId: brand.id,
      },
    });

    // Se produto validado, criar validação
    if (productData.status === 'VALIDATED') {
      await prisma.validation.create({
        data: {
          product: { connect: { id: product.id } },
          user: { connect: { id: brand.id } },
          status: 'VALIDATED',
          type: 'LABORATORY',
          claimsValidated: JSON.stringify({
            'Orgânico': { validated: true, notes: 'Certificado verificado' },
            'Sem Glúten': { validated: true, notes: 'Análise laboratorial confirmada' },
            'Vegano': { validated: true, notes: 'Ingredientes verificados' },
          }),
          summary: 'Produto aprovado em todos os testes',
          validatedAt: new Date(),
        },
      });
    }

    console.log(`✅ Produto criado: ${product.name} (${product.status})`);
  }

  console.log('\n🎉 Seed de teste concluído com sucesso!');
  console.log('\n👤 Credenciais de acesso:');
  console.log('Brand: brand@truelabel.com.br / brand123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });