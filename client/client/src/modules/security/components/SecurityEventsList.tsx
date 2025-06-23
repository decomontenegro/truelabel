/**
 * Security Events List Component
 * 
 * Lista de eventos de segurança com filtros e ações
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Shield,
  Eye,
  Lock,
  User,
  Globe,
  CheckCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { SecurityEvent, SecurityEventType, SecuritySeverity } from '../types';

interface SecurityEventsListProps {
  events: SecurityEvent[];
  loading?: boolean;
  onRefresh?: () => void;
  onResolveEvent?: (eventId: string, notes?: string) => void;
  onViewDetails?: (event: SecurityEvent) => void;
}

const eventTypeIcons: Record<SecurityEventType, React.ReactNode> = {
  LOGIN_SUCCESS: <User className="h-4 w-4 text-green-500" />,
  LOGIN_FAILED: <User className="h-4 w-4 text-red-500" />,
  LOGIN_SUSPICIOUS: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  PASSWORD_CHANGE: <Lock className="h-4 w-4 text-blue-500" />,
  PASSWORD_RESET: <Lock className="h-4 w-4 text-yellow-500" />,
  ACCOUNT_LOCKED: <Lock className="h-4 w-4 text-red-500" />,
  ACCOUNT_UNLOCKED: <Lock className="h-4 w-4 text-green-500" />,
  PERMISSION_DENIED: <Shield className="h-4 w-4 text-red-500" />,
  DATA_ACCESS: <Eye className="h-4 w-4 text-blue-500" />,
  DATA_EXPORT: <Eye className="h-4 w-4 text-orange-500" />,
  API_ABUSE: <Globe className="h-4 w-4 text-red-500" />,
  BRUTE_FORCE: <AlertTriangle className="h-4 w-4 text-red-500" />,
  SQL_INJECTION: <AlertTriangle className="h-4 w-4 text-red-500" />,
  XSS_ATTEMPT: <AlertTriangle className="h-4 w-4 text-red-500" />,
  CSRF_ATTEMPT: <AlertTriangle className="h-4 w-4 text-red-500" />,
  MALWARE_DETECTED: <AlertTriangle className="h-4 w-4 text-red-500" />,
  SUSPICIOUS_ACTIVITY: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  POLICY_VIOLATION: <Shield className="h-4 w-4 text-orange-500" />,
  COMPLIANCE_ISSUE: <Shield className="h-4 w-4 text-yellow-500" />,
};

const severityColors: Record<SecuritySeverity, string> = {
  LOW: 'border-l-gray-400 bg-gray-50',
  MEDIUM: 'border-l-yellow-400 bg-yellow-50',
  HIGH: 'border-l-orange-400 bg-orange-50',
  CRITICAL: 'border-l-red-500 bg-red-50',
};

const severityTextColors: Record<SecuritySeverity, string> = {
  LOW: 'text-gray-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-600',
  CRITICAL: 'text-red-600',
};

export function SecurityEventsList({
  events,
  loading = false,
  onRefresh,
  onResolveEvent,
  onViewDetails
}: SecurityEventsListProps) {
  const formatEventType = (type: SecurityEventType): string => {
    const typeMap: Record<SecurityEventType, string> = {
      LOGIN_SUCCESS: 'Login Bem-sucedido',
      LOGIN_FAILED: 'Falha no Login',
      LOGIN_SUSPICIOUS: 'Login Suspeito',
      PASSWORD_CHANGE: 'Alteração de Senha',
      PASSWORD_RESET: 'Reset de Senha',
      ACCOUNT_LOCKED: 'Conta Bloqueada',
      ACCOUNT_UNLOCKED: 'Conta Desbloqueada',
      PERMISSION_DENIED: 'Permissão Negada',
      DATA_ACCESS: 'Acesso a Dados',
      DATA_EXPORT: 'Exportação de Dados',
      API_ABUSE: 'Abuso de API',
      BRUTE_FORCE: 'Ataque de Força Bruta',
      SQL_INJECTION: 'Tentativa de SQL Injection',
      XSS_ATTEMPT: 'Tentativa de XSS',
      CSRF_ATTEMPT: 'Tentativa de CSRF',
      MALWARE_DETECTED: 'Malware Detectado',
      SUSPICIOUS_ACTIVITY: 'Atividade Suspeita',
      POLICY_VIOLATION: 'Violação de Política',
      COMPLIANCE_ISSUE: 'Problema de Compliance',
    };
    return typeMap[type] || type;
  };

  const formatSeverity = (severity: SecuritySeverity): string => {
    const severityMap: Record<SecuritySeverity, string> = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    };
    return severityMap[severity];
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Nenhum evento de segurança encontrado</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {events.map((event) => (
        <div
          key={event.id}
          className={`p-4 border-l-4 hover:bg-gray-50 transition-colors ${severityColors[event.severity]}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {eventTypeIcons[event.eventType]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {formatEventType(event.eventType)}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityTextColors[event.severity]} bg-white`}>
                    {formatSeverity(event.severity)}
                  </span>
                  {event.resolved && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {event.description}
                </p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {event.userId && (
                    <span className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>ID: {event.userId}</span>
                    </span>
                  )}
                  
                  {event.ipAddress && (
                    <span className="flex items-center space-x-1">
                      <Globe className="h-3 w-3" />
                      <span>{event.ipAddress}</span>
                    </span>
                  )}
                  
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </span>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="mt-2 text-xs text-gray-500">
                    📍 {event.location.city}, {event.location.country}
                  </div>
                )}

                {/* Resolution info */}
                {event.resolved && event.resolvedAt && (
                  <div className="mt-2 text-xs text-green-600">
                    ✅ Resolvido {formatDistanceToNow(new Date(event.resolvedAt), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                    {event.resolvedBy && ` por ${event.resolvedBy}`}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {!event.resolved && onResolveEvent && (
                <button
                  onClick={() => onResolveEvent(event.id)}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  Resolver
                </button>
              )}
              
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(event)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Detalhes
                </button>
              )}
              
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
