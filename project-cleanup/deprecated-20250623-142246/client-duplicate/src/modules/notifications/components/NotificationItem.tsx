/**
 * Notification Item Component
 * 
 * Componente individual para exibir uma notificação
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  Archive,
  ExternalLink
} from 'lucide-react';
import type { BaseNotification, NotificationType } from '../types';

interface NotificationItemProps {
  notification: BaseNotification;
  onClick?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  showActions?: boolean;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  VALIDATION_COMPLETED: <CheckCircle className="h-5 w-5 text-green-500" />,
  VALIDATION_REJECTED: <XCircle className="h-5 w-5 text-red-500" />,
  PRODUCT_APPROVED: <CheckCircle className="h-5 w-5 text-green-500" />,
  PRODUCT_REJECTED: <XCircle className="h-5 w-5 text-red-500" />,
  REPORT_UPLOADED: <Info className="h-5 w-5 text-blue-500" />,
  QR_CODE_GENERATED: <Info className="h-5 w-5 text-blue-500" />,
  LABORATORY_ASSIGNED: <Info className="h-5 w-5 text-blue-500" />,
  DEADLINE_APPROACHING: <Clock className="h-5 w-5 text-orange-500" />,
  SYSTEM_MAINTENANCE: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  SECURITY_ALERT: <AlertTriangle className="h-5 w-5 text-red-500" />,
  PAYMENT_REQUIRED: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  SUBSCRIPTION_EXPIRING: <Clock className="h-5 w-5 text-orange-500" />,
};

const priorityColors = {
  LOW: 'border-l-gray-300',
  MEDIUM: 'border-l-blue-400',
  HIGH: 'border-l-orange-400',
  URGENT: 'border-l-red-500',
};

export function NotificationItem({
  notification,
  onClick,
  onDelete,
  onArchive,
  showActions = true
}: NotificationItemProps) {
  const isUnread = notification.status === 'UNREAD';
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR
  });

  const handleClick = () => {
    onClick?.();
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.();
  };

  return (
    <div
      className={`
        relative p-4 border-l-4 cursor-pointer transition-colors
        ${priorityColors[notification.priority]}
        ${isUnread ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'}
      `}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {typeIcons[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {notification.actionUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(notification.actionUrl, '_blank');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Abrir link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
                
                {onArchive && (
                  <button
                    onClick={handleArchive}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Arquivar"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{timeAgo}</span>
            
            {notification.priority !== 'MEDIUM' && (
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${notification.priority === 'LOW' ? 'bg-gray-100 text-gray-600' : ''}
                ${notification.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' : ''}
                ${notification.priority === 'URGENT' ? 'bg-red-100 text-red-600' : ''}
              `}>
                {notification.priority === 'LOW' && 'Baixa'}
                {notification.priority === 'HIGH' && 'Alta'}
                {notification.priority === 'URGENT' && 'Urgente'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
