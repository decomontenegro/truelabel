import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

const emailTemplates: Record<string, string> = {
  welcome: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f4f4f4; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TRUST LABEL</h1>
        </div>
        <div class="content">
          <h2>Bem-vindo, {{name}}!</h2>
          <p>Obrigado por se cadastrar no TRUST LABEL. Estamos animados em tê-lo conosco!</p>
          <p>Com o TRUST LABEL, você pode:</p>
          <ul>
            <li>Validar produtos com tecnologia AI</li>
            <li>Gerar QR codes rastreáveis</li>
            <li>Acessar relatórios detalhados</li>
            <li>Garantir transparência aos consumidores</li>
          </ul>
          <p><a href="{{frontendUrl}}/dashboard" class="button">Acessar Dashboard</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  'reset-password': `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f4f4f4; }
        .button { display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TRUST LABEL</h1>
        </div>
        <div class="content">
          <h2>Redefinir Senha</h2>
          <p>Olá {{name}},</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <p><a href="{{resetUrl}}" class="button">Redefinir Senha</a></p>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou esta alteração, ignore este email.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  'validation-complete': `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f4f4f4; }
        .button { display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .approved { background-color: #d4edda; color: #155724; }
        .rejected { background-color: #f8d7da; color: #721c24; }
        .warning { background-color: #fff3cd; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TRUST LABEL</h1>
        </div>
        <div class="content">
          <h2>Validação Concluída!</h2>
          <p>Olá {{brandName}},</p>
          <p>A validação do produto <strong>{{productName}}</strong> foi concluída.</p>
          <div class="status {{statusClass}}">
            <strong>Status:</strong> {{status}}
          </div>
          <p><strong>Confiança AI:</strong> {{aiConfidence}}%</p>
          <p><strong>QR Code ID:</strong> {{qrCodeId}}</p>
          <p><a href="{{reportUrl}}" class="button">Ver Relatório Completo</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
};

export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, template, data, attachments } = options;

    // Get template
    let html = emailTemplates[template];
    if (!html) {
      throw new Error(`Email template '${template}' not found`);
    }

    // Replace variables
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    });

    // Add frontend URL
    html = html.replace(/{{frontendUrl}}/g, process.env.FRONTEND_URL || 'http://localhost:3000');

    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'noreply@trustlabel.com',
      subject,
      html,
      attachments,
    };

    if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Email sent to ${to} with subject: ${subject}`);
    } else {
      logger.info(`[DEV] Email would be sent to ${to} with subject: ${subject}`);
      logger.debug('Email content:', html);
    }
  } catch (error) {
    logger.error('Failed to send email:', error);
    // Don't throw error to avoid breaking the flow
  }
}

export async function sendBulkEmails(emails: EmailOptions[]) {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    logger.warn(`${failed} out of ${emails.length} emails failed to send`);
  }
}