import { emailService } from '../src/services/emailService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testEmail() {
  const testEmailAddress = process.argv[2];
  
  if (!testEmailAddress) {
    console.error('❌ Por favor, forneça um email para teste:');
    console.error('   npx ts-node scripts/test-email.ts seu-email@exemplo.com');
    process.exit(1);
  }

  console.log('📧 Testando configuração de email...');
  console.log(`📨 Enviando para: ${testEmailAddress}`);
  console.log(`🔧 Provider: ${process.env.EMAIL_PROVIDER || 'não configurado'}`);
  console.log('');

  try {
    const result = await emailService.sendEmail({
      to: testEmailAddress,
      subject: 'True Label - Teste de Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">True Label</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <h2 style="color: #1f2937;">✅ Email de Teste</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Se você está recebendo este email, a configuração está funcionando corretamente!
            </p>
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Detalhes da Configuração:</h3>
              <ul style="color: #4b5563;">
                <li>Provider: ${process.env.EMAIL_PROVIDER || 'não configurado'}</li>
                <li>From: ${process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'não configurado'}</li>
                <li>Ambiente: ${process.env.NODE_ENV || 'development'}</li>
              </ul>
            </div>
            <p style="color: #4b5563; font-size: 14px; text-align: center; margin-top: 30px;">
              Este é um email de teste enviado pelo sistema True Label.
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 Detalhes:', result);
    console.log('\n🎉 Configuração de email funcionando perfeitamente!');
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error.message);
    console.error('\n🔍 Verifique:');
    console.error('   1. As variáveis de ambiente estão corretas no .env');
    console.error('   2. A API key ou credenciais estão válidas');
    console.error('   3. O sender foi verificado (SendGrid)');
    console.error('   4. Não há restrições de firewall');
    console.error('\nDetalhes completos do erro:', error);
    process.exit(1);
  }
}

// Run the test
testEmail();