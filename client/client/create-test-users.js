import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔧 Criando usuários de teste...\n');
    
    // Criar admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@truelabel.com' },
      update: {},
      create: {
        email: 'admin@truelabel.com',
        password: hashedPassword,
        name: 'Admin',
        type: 'ADMIN'
      }
    });
    
    console.log('✅ Admin criado:', admin.email);
    
    // Criar brand user
    const brand = await prisma.user.upsert({
      where: { email: 'brand@example.com' },
      update: {},
      create: {
        email: 'brand@example.com',
        password: hashedPassword,
        name: 'Brand User',
        type: 'BRAND'
      }
    });
    
    console.log('✅ Brand criado:', brand.email);
    
    // Criar lab user
    const lab = await prisma.user.upsert({
      where: { email: 'lab@example.com' },
      update: {},
      create: {
        email: 'lab@example.com',
        password: hashedPassword,
        name: 'Lab User',
        type: 'LAB'
      }
    });
    
    console.log('✅ Lab criado:', lab.email);
    
    console.log('\n🎉 Usuários criados com sucesso!');
    console.log('\nCredenciais:');
    console.log('- admin@truelabel.com / admin123');
    console.log('- brand@example.com / admin123');
    console.log('- lab@example.com / admin123');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();