import * as Sentry from '@sentry/react';
import { env, isProduction } from '@/config/env-validation';

/**
 * Inicializa o Sentry para monitoramento de erros
 * Só é ativado em produção e se o DSN estiver configurado
 */
export function initSentry() {
  // Só inicializa se estiver em produção e tiver DSN configurado
  if (!isProduction || !env.VITE_SENTRY_DSN) {
    console.log('🔍 Sentry não inicializado (desenvolvimento ou sem DSN)');
    return;
  }

  try {
    Sentry.init({
      dsn: env.VITE_SENTRY_DSN,
      environment: env.VITE_ENVIRONMENT,
      integrations: [
        Sentry.browserTracingIntegration({
          // Rastrear apenas requisições para nossa API
          tracePropagationTargets: [env.VITE_API_BASE_URL],
        }),
      ],
      // Taxa de amostragem de performance
      tracesSampleRate: 0.1, // 10% das transações
      // Taxa de amostragem de sessões
      replaysSessionSampleRate: 0.1, // 10% das sessões
      replaysOnErrorSampleRate: 1.0, // 100% das sessões com erro
      
      // Configurações adicionais
      beforeSend(event, hint) {
        // Filtrar erros que não queremos rastrear
        const error = hint.originalException;
        
        // Ignorar erros de rede comuns
        if (error && error instanceof Error) {
          if (error.message.includes('Network request failed')) {
            return null;
          }
          if (error.message.includes('Failed to fetch')) {
            return null;
          }
        }
        
        // Remover dados sensíveis
        if (event.request && event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
        
        // Adicionar contexto do usuário (sem dados sensíveis)
        const user = localStorage.getItem('user');
        if (user) {
          try {
            const userData = JSON.parse(user);
            event.user = {
              id: userData.id,
              email: userData.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mascarar email
              role: userData.role,
            };
          } catch (e) {
            // Ignorar erro de parse
          }
        }
        
        return event;
      },
      
      // Ignorar erros específicos
      ignoreErrors: [
        // Erros de browser
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // Erros de extensões
        'chrome-extension://',
        'moz-extension://',
        // Erros de console
        'console.error',
        // Erros de desenvolvimento
        'Failed to load resource',
      ],
    });
    
    console.log('✅ Sentry inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Sentry:', error);
  }
}

/**
 * Captura erro manualmente
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!isProduction || !env.VITE_SENTRY_DSN) return;
  
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
  if (!isProduction || !env.VITE_SENTRY_DSN) return;
  
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
  if (!isProduction || !env.VITE_SENTRY_DSN) return;
  
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Define contexto do usuário
 */
export function setUser(user: { id: string; email?: string; role?: string } | null) {
  if (!isProduction || !env.VITE_SENTRY_DSN) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mascarar email
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * ErrorBoundary com Sentry
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

