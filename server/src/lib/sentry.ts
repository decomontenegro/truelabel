import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node'; // Temporariamente desabilitado para Mac ARM64
import { config, isProduction } from '../config/env';
import type { Express, Request, Response, NextFunction } from 'express';

/**
 * Inicializa o Sentry para monitoramento de erros
 */
export function initSentry(app: Express) {
  // Só inicializa se estiver em produção e tiver DSN configurado
  if (!isProduction || !config.monitoring.sentryDsn) {
    console.log('🔍 Sentry não inicializado (desenvolvimento ou sem DSN)');
    return;
  }

  try {
    Sentry.init({
      dsn: config.monitoring.sentryDsn,
      environment: config.NODE_ENV,
      integrations: [
        // HTTP tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Express
        new Sentry.Integrations.Express({ app }),
        // Profiling - Temporariamente desabilitado para Mac ARM64
        // new ProfilingIntegration(),
        // Prisma
        new Sentry.Integrations.Prisma({ client: true }),
      ],
      // Taxa de amostragem
      tracesSampleRate: config.isDevelopment ? 1.0 : 0.1, // 100% dev, 10% prod
      profilesSampleRate: config.isDevelopment ? 1.0 : 0.1, // 100% dev, 10% prod
      
      // Configurações adicionais
      beforeSend(event, hint) {
        // Filtrar erros que não queremos rastrear
        const error = hint.originalException;
        
        // Ignorar erros esperados
        if (error && error instanceof Error) {
          // Erros de validação
          if (error.name === 'ValidationError') {
            return null;
          }
          // Erros de autenticação
          if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
            return null;
          }
        }
        
        // Remover dados sensíveis
        if (event.request) {
          // Remover headers sensíveis
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
          }
          
          // Remover dados sensíveis do body
          if (event.request.data) {
            delete event.request.data.password;
            delete event.request.data.senha;
            delete event.request.data.token;
            delete event.request.data.jwt;
          }
        }
        
        return event;
      },
      
      // Ignorar transações específicas
      beforeTransaction(transaction) {
        // Ignorar health checks
        if (transaction.name === 'GET /health') {
          return null;
        }
        // Ignorar arquivos estáticos
        if (transaction.name?.includes('/static/') || transaction.name?.includes('/uploads/')) {
          return null;
        }
        return transaction;
      },
    });
    
    console.log('✅ Sentry inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Sentry:', error);
  }
}

/**
 * Middleware do Sentry para Express
 */
export const sentryRequestHandler = () => {
  if (!isProduction || !config.monitoring.sentryDsn) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.requestHandler();
};

/**
 * Middleware de tracing do Sentry
 */
export const sentryTracingHandler = () => {
  if (!isProduction || !config.monitoring.sentryDsn) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

/**
 * Middleware de erro do Sentry (deve ser o último)
 */
export const sentryErrorHandler = () => {
  if (!isProduction || !config.monitoring.sentryDsn) {
    return (err: Error, req: Request, res: Response, next: NextFunction) => next(err);
  }
  return Sentry.Handlers.errorHandler();
};

/**
 * Captura erro manualmente
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!isProduction || !config.monitoring.sentryDsn) return;
  
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Captura mensagem
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!isProduction || !config.monitoring.sentryDsn) return;
  
  Sentry.captureMessage(message, level);
}

/**
 * Adiciona breadcrumb
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  if (!isProduction || !config.monitoring.sentryDsn) return;
  
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Define contexto do usuário
 */
export function setUser(user: { id: string; email?: string; role?: string } | null) {
  if (!isProduction || !config.monitoring.sentryDsn) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Cria uma transação personalizada
 */
export function startTransaction(options: {
  name: string;
  op: string;
  data?: Record<string, any>;
}) {
  if (!isProduction || !config.monitoring.sentryDsn) {
    return {
      setHttpStatus: () => {},
      finish: () => {}
    };
  }
  
  return Sentry.startTransaction(options);
}

// Re-exportar captureException do Sentry
export { captureException } from '@sentry/node';