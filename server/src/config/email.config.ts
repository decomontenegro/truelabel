/**
 * Email Service Configuration
 * 
 * Supports multiple email providers:
 * - SendGrid (recommended for production)
 * - SMTP (Gmail, Outlook, custom)
 * - Mailgun
 * - AWS SES
 */

interface EmailConfig {
  enabled: boolean;
  provider: 'sendgrid' | 'smtp' | 'mailgun' | 'ses' | 'console';
  from: {
    name: string;
    email: string;
  };
  replyTo?: string;
  templates: {
    welcomeUser: string;
    passwordReset: string;
    validationComplete: string;
    validationRequest: string;
    reportReady: string;
    qrCodeGenerated: string;
  };
  sendgrid?: {
    apiKey: string;
    sandboxMode?: boolean;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  mailgun?: {
    apiKey: string;
    domain: string;
    region?: 'us' | 'eu';
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

// Email configuration based on environment
export const emailConfig: EmailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  provider: (process.env.EMAIL_PROVIDER as EmailConfig['provider']) || 'console',
  from: {
    name: process.env.EMAIL_FROM_NAME || 'True Label',
    email: process.env.EMAIL_FROM || 'noreply@truelabel.com'
  },
  replyTo: process.env.EMAIL_REPLY_TO,
  
  // Email template IDs (for SendGrid) or paths (for local templates)
  templates: {
    welcomeUser: process.env.EMAIL_TEMPLATE_WELCOME || 'd-welcome001',
    passwordReset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET || 'd-reset001',
    validationComplete: process.env.EMAIL_TEMPLATE_VALIDATION_COMPLETE || 'd-valid001',
    validationRequest: process.env.EMAIL_TEMPLATE_VALIDATION_REQUEST || 'd-request001',
    reportReady: process.env.EMAIL_TEMPLATE_REPORT_READY || 'd-report001',
    qrCodeGenerated: process.env.EMAIL_TEMPLATE_QR_GENERATED || 'd-qr001'
  },
  
  // SendGrid configuration
  sendgrid: process.env.SENDGRID_API_KEY ? {
    apiKey: process.env.SENDGRID_API_KEY,
    sandboxMode: process.env.NODE_ENV === 'development'
  } : undefined,
  
  // SMTP configuration
  smtp: process.env.SMTP_HOST ? {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  } : undefined,
  
  // Mailgun configuration
  mailgun: process.env.MAILGUN_API_KEY ? {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN || '',
    region: (process.env.MAILGUN_REGION as 'us' | 'eu') || 'us'
  } : undefined,
  
  // AWS SES configuration
  ses: process.env.AWS_SES_REGION ? {
    region: process.env.AWS_SES_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  } : undefined
};

// Validate email configuration
export function validateEmailConfig(): void {
  if (!emailConfig.enabled) {
    console.log('📧 Email service is disabled');
    return;
  }

  switch (emailConfig.provider) {
    case 'sendgrid':
      if (!emailConfig.sendgrid?.apiKey) {
        throw new Error('SendGrid API key is required when using SendGrid provider');
      }
      break;
      
    case 'smtp':
      if (!emailConfig.smtp?.host || !emailConfig.smtp?.auth.user) {
        throw new Error('SMTP host and credentials are required when using SMTP provider');
      }
      break;
      
    case 'mailgun':
      if (!emailConfig.mailgun?.apiKey || !emailConfig.mailgun?.domain) {
        throw new Error('Mailgun API key and domain are required when using Mailgun provider');
      }
      break;
      
    case 'ses':
      if (!emailConfig.ses?.region || !emailConfig.ses?.accessKeyId) {
        throw new Error('AWS SES region and credentials are required when using SES provider');
      }
      break;
      
    case 'console':
      console.log('📧 Email provider set to console (development mode)');
      break;
      
    default:
      throw new Error(`Unknown email provider: ${emailConfig.provider}`);
  }
}

// Email rate limiting configuration
export const emailRateLimits = {
  // Maximum emails per user per hour
  perUserPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_USER || '10'),
  
  // Maximum emails per IP per hour
  perIpPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_IP || '50'),
  
  // Maximum total emails per hour
  globalPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_GLOBAL || '1000'),
  
  // Cooldown period for password reset emails (minutes)
  passwordResetCooldown: parseInt(process.env.EMAIL_PASSWORD_RESET_COOLDOWN || '5')
};

// Email queue configuration
export const emailQueueConfig = {
  // Use queue for sending emails
  enabled: process.env.EMAIL_QUEUE_ENABLED === 'true',
  
  // Queue name
  queueName: process.env.EMAIL_QUEUE_NAME || 'email-queue',
  
  // Retry configuration
  retries: parseInt(process.env.EMAIL_QUEUE_RETRIES || '3'),
  retryDelay: parseInt(process.env.EMAIL_QUEUE_RETRY_DELAY || '5000'), // ms
  
  // Batch size for bulk sending
  batchSize: parseInt(process.env.EMAIL_QUEUE_BATCH_SIZE || '50')
};

export default emailConfig;