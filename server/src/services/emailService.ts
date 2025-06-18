import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { prisma } from '../lib/prisma';
import emailConfig, { validateEmailConfig, emailRateLimits } from '../config/email.config';
import logger from '../utils/logger';
import cacheService from './cacheService';

// Validate configuration on startup
validateEmailConfig();

// Configure SendGrid if enabled
if (emailConfig.provider === 'sendgrid' && emailConfig.sendgrid?.apiKey) {
  sgMail.setApiKey(emailConfig.sendgrid.apiKey);
}

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

// Enhanced Email Service with multiple provider support
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
      this.transporter = nodemailer.createTransporter(emailConfig.smtp);
    } else if (emailConfig.provider === 'console') {
      // Console provider for development
      this.transporter = null;
    }
  }

  /**
   * Check rate limits before sending email
   */
  private async checkRateLimit(to: string, type: string = 'general'): Promise<boolean> {
    const userKey = `email:ratelimit:user:${to}:${type}`;
    const globalKey = `email:ratelimit:global:${new Date().getHours()}`;

    // Check user rate limit
    const userCount = await cacheService.get<number>('ratelimit', userKey) || 0;
    if (userCount >= emailRateLimits.perUserPerHour) {
      logger.warn('Email rate limit exceeded for user', { to, type });
      return false;
    }

    // Check global rate limit
    const globalCount = await cacheService.get<number>('ratelimit', globalKey) || 0;
    if (globalCount >= emailRateLimits.globalPerHour) {
      logger.warn('Global email rate limit exceeded');
      return false;
    }

    // Increment counters
    await cacheService.set('ratelimit', userKey, userCount + 1, { ttl: 3600 });
    await cacheService.set('ratelimit', globalKey, globalCount + 1, { ttl: 3600 });

    return true;
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(to: string | string[], subject: string, html: string, options?: {
    text?: string;
    attachments?: any[];
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    type?: string;
  }) {
    try {
      // Check if email is enabled
      if (!emailConfig.enabled) {
        logger.info('Email service is disabled, logging to console instead');
        console.log('\n📧 EMAIL (Console Mode)\n' +
          `To: ${Array.isArray(to) ? to.join(', ') : to}\n` +
          `Subject: ${subject}\n` +
          `Type: ${options?.type || 'general'}\n` +
          '---\n');
        return { success: true, messageId: 'console-' + Date.now() };
      }

      // Check rate limits
      const primaryRecipient = Array.isArray(to) ? to[0] : to;
      const canSend = await this.checkRateLimit(primaryRecipient, options?.type);
      if (!canSend) {
        throw new Error('Rate limit exceeded');
      }

      // Send based on provider
      let result: any;
      
      switch (emailConfig.provider) {
        case 'sendgrid':
          result = await this.sendViaSendGrid(to, subject, html, options);
          break;
          
        case 'smtp':
          result = await this.sendViaSMTP(to, subject, html, options);
          break;
          
        case 'console':
          console.log('\n📧 EMAIL (Console Mode)\n' +
            `To: ${Array.isArray(to) ? to.join(', ') : to}\n` +
            `Subject: ${subject}\n` +
            '---\n' +
            html.replace(/<[^>]*>/g, '') + '\n');
          result = { success: true, messageId: 'console-' + Date.now() };
          break;
          
        default:
          throw new Error(`Unsupported email provider: ${emailConfig.provider}`);
      }

      logger.info('Email sent successfully', {
        to,
        subject,
        provider: emailConfig.provider,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to send email', { error, to, subject });
      throw error;
    }
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(to: string | string[], subject: string, html: string, options?: any) {
    const msg = {
      to,
      from: {
        email: emailConfig.from.email,
        name: emailConfig.from.name
      },
      subject,
      html,
      text: options?.text || html.replace(/<[^>]*>/g, ''),
      cc: options?.cc,
      bcc: options?.bcc,
      replyTo: options?.replyTo || emailConfig.replyTo,
      attachments: options?.attachments,
      sandboxMode: {
        enable: emailConfig.sendgrid?.sandboxMode || false
      }
    };

    const response = await sgMail.send(msg);
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      response
    };
  }

  /**
   * Send via SMTP
   */
  private async sendViaSMTP(to: string | string[], subject: string, html: string, options?: any) {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const info = await this.transporter.sendMail({
      from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: options?.text || html.replace(/<[^>]*>/g, ''),
      cc: options?.cc?.join(', '),
      bcc: options?.bcc?.join(', '),
      replyTo: options?.replyTo || emailConfig.replyTo,
      attachments: options?.attachments
    });

    // Show preview URL in development
    if (process.env.NODE_ENV === 'development' && emailConfig.smtp?.host === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      logger.info('Email preview URL:', previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      response: info
    };
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

      // Send notification to admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true }
      });
      
      if (admins.length > 0) {
        await this.sendEmail(
          admins.map(a => a.email),
          template.subject,
          template.html,
          { type: 'report_uploaded' }
        );
      }

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
