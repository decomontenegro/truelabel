import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuração do transporter de email
const createTransporter = () => {
  // Em produção, usar serviços como SendGrid, AWS SES, etc.
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      service: 'gmail', // ou outro serviço
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Para desenvolvimento, usar Ethereal Email (teste)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
      }
    });
  }
};

// Templates de email
const emailTemplates = {
  reportUploaded: (data: any) => ({
    subject: `Novo laudo enviado - ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1>True Label</h1>
          <h2>Novo Laudo Enviado</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Olá,</p>
          
          <p>Um novo laudo foi enviado para validação:</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Detalhes do Produto</h3>
            <p><strong>Nome:</strong> ${data.productName}</p>
            <p><strong>Marca:</strong> ${data.brandName}</p>
            <p><strong>Tipo de Análise:</strong> ${data.analysisType}</p>
            <p><strong>Laboratório:</strong> ${data.laboratoryName}</p>
          </div>
          
          <p>O laudo está aguardando validação. Você pode acessar o dashboard para revisar e aprovar.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Acessar Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p>True Label - Plataforma de Validação Transparente</p>
          <p>Este é um email automático, não responda.</p>
        </div>
      </div>
    `
  }),

  validationApproved: (data: any) => ({
    subject: `Validação aprovada - ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1>True Label</h1>
          <h2>✅ Validação Aprovada</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Parabéns!</p>
          
          <p>Seu produto foi validado com sucesso:</p>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0; color: #065f46;">Produto Validado</h3>
            <p><strong>Nome:</strong> ${data.productName}</p>
            <p><strong>Claims Validados:</strong> ${data.claimsValidated?.join(', ') || 'N/A'}</p>
            <p><strong>Data da Validação:</strong> ${new Date(data.validatedAt).toLocaleDateString('pt-BR')}</p>
          </div>
          
          <p>Agora você pode gerar o QR Code para incluir na embalagem do produto.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/products/${data.productId}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
              Ver Produto
            </a>
            <a href="${process.env.FRONTEND_URL}/dashboard/qr-codes" 
               style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Gerar QR Code
            </a>
          </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p>True Label - Plataforma de Validação Transparente</p>
        </div>
      </div>
    `
  }),

  validationRejected: (data: any) => ({
    subject: `Validação rejeitada - ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>True Label</h1>
          <h2>❌ Validação Rejeitada</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Informamos que a validação do seu produto foi rejeitada:</p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 10px 0; color: #991b1b;">Produto Rejeitado</h3>
            <p><strong>Nome:</strong> ${data.productName}</p>
            <p><strong>Motivo:</strong> ${data.rejectionReason || 'Não especificado'}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <p>Por favor, revise o laudo e os claims do produto. Você pode enviar um novo laudo após fazer as correções necessárias.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/products/${data.productId}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Ver Detalhes
            </a>
          </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p>True Label - Plataforma de Validação Transparente</p>
        </div>
      </div>
    `
  })
};

// Serviço de email
export class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = createTransporter();
  }

  // Enviar email genérico
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"True Label" <${process.env.EMAIL_FROM || 'noreply@truelabel.com'}>`,
        to,
        subject,
        html
      });

      console.log('Email enviado:', info.messageId);
      
      // Em desenvolvimento, mostrar preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error };
    }
  }

  // Notificar upload de laudo
  async notifyReportUploaded(reportId: string) {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          product: {
            include: {
              user: true
            }
          },
          laboratory: true
        }
      });

      if (!report) {
        throw new Error('Laudo não encontrado');
      }

      const template = emailTemplates.reportUploaded({
        productName: report.product.name,
        brandName: report.product.brand,
        analysisType: report.analysisType,
        laboratoryName: report.laboratory.name
      });

      // Enviar para o usuário que fez upload
      await this.sendEmail(
        report.product.user.email,
        template.subject,
        template.html
      );

      // TODO: Enviar para validadores/administradores

    } catch (error) {
      console.error('Erro ao notificar upload de laudo:', error);
    }
  }

  // Notificar validação aprovada
  async notifyValidationApproved(validationId: string) {
    try {
      const validation = await prisma.validation.findUnique({
        where: { id: validationId },
        include: {
          report: {
            include: {
              product: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!validation) {
        throw new Error('Validação não encontrada');
      }

      const template = emailTemplates.validationApproved({
        productName: validation.report.product.name,
        productId: validation.report.product.id,
        claimsValidated: validation.claimsValidated,
        validatedAt: validation.validatedAt
      });

      await this.sendEmail(
        validation.report.product.user.email,
        template.subject,
        template.html
      );

    } catch (error) {
      console.error('Erro ao notificar validação aprovada:', error);
    }
  }

  // Notificar validação rejeitada
  async notifyValidationRejected(validationId: string, rejectionReason?: string) {
    try {
      const validation = await prisma.validation.findUnique({
        where: { id: validationId },
        include: {
          report: {
            include: {
              product: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!validation) {
        throw new Error('Validação não encontrada');
      }

      const template = emailTemplates.validationRejected({
        productName: validation.report.product.name,
        productId: validation.report.product.id,
        rejectionReason
      });

      await this.sendEmail(
        validation.report.product.user.email,
        template.subject,
        template.html
      );

    } catch (error) {
      console.error('Erro ao notificar validação rejeitada:', error);
    }
  }
}

// Instância singleton
export const emailService = new EmailService();
