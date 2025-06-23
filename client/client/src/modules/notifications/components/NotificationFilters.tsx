/**
 * Notification Filters Component
 * 
 * Componente para filtrar notificações
 */

import React from 'react';
import { Filter, X } from 'lucide-react';
import type { NotificationFilter, NotificationType, NotificationPriority, NotificationStatus } from '../types';

interface NotificationFiltersProps {
  filters: NotificationFilter;
  onChange: (filters: NotificationFilter) => void;
  onReset?: () => void;
}

const notificationTypes: { value: NotificationType; label: string }[] = [
  { value: 'VALIDATION_COMPLETED', label: 'Validação Concluída' },
  { value: 'VALIDATION_REJECTED', label: 'Validação Rejeitada' },
  { value: 'PRODUCT_APPROVED', label: 'Produto Aprovado' },
  { value: 'PRODUCT_REJECTED', label: 'Produto Rejeitado' },
  { value: 'REPORT_UPLOADED', label: 'Relatório Enviado' },
  { value: 'QR_CODE_GENERATED', label: 'QR Code Gerado' },
  { value: 'LABORATORY_ASSIGNED', label: 'Laboratório Atribuído' },
  { value: 'DEADLINE_APPROACHING', label: 'Prazo Próximo' },
  { value: 'SYSTEM_MAINTENANCE', label: 'Manutenção do Sistema' },
  { value: 'SECURITY_ALERT', label: 'Alerta de Segurança' },
  { value: 'PAYMENT_REQUIRED', label: 'Pagamento Necessário' },
  { value: 'SUBSCRIPTION_EXPIRING', label: 'Assinatura Expirando' },
];

const priorities: { value: NotificationPriority; label: string }[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

const statuses: { value: NotificationStatus; label: string }[] = [
  { value: 'UNREAD', label: 'Não Lida' },
  { value: 'READ', label: 'Lida' },
  { value: 'ARCHIVED', label: 'Arquivada' },
  { value: 'DISMISSED', label: 'Dispensada' },
];

export function NotificationFilters({ filters, onChange, onReset }: NotificationFiltersProps) {
  const handleTypeChange = (type: NotificationType, checked: boolean) => {
    const currentTypes = filters.type || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    onChange({ ...filters, type: newTypes.length > 0 ? newTypes : undefined });
  };

  const handlePriorityChange = (priority: NotificationPriority, checked: boolean) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    
    onChange({ ...filters, priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const handleStatusChange = (status: NotificationStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    onChange({ ...filters, [field]: value || undefined });
  };

  const hasActiveFilters = !!(
    filters.type?.length ||
    filters.priority?.length ||
    filters.status?.length ||
    filters.dateFrom ||
    filters.dateTo
  );

  const handleReset = () => {
    onChange({
      page: filters.page,
      limit: filters.limit,
    });
    onReset?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="space-y-1">
          {statuses.map(({ value, label }) => (
            <label key={value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.status?.includes(value) || false}
                onChange={(e) => handleStatusChange(value, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prioridade
        </label>
        <div className="space-y-1">
          {priorities.map(({ value, label }) => (
            <label key={value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.priority?.includes(value) || false}
                onChange={(e) => handlePriorityChange(value, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo
        </label>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {notificationTypes.map(({ value, label }) => (
            <label key={value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.type?.includes(value) || false}
                onChange={(e) => handleTypeChange(value, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Período
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">De:</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateChange('dateFrom', e.target.value)}
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Até:</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateChange('dateTo', e.target.value)}
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
