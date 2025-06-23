/**
 * Notification Center Component
 * 
 * Centro de notificações com dropdown e gerenciamento
 */

import React, { useState } from 'react';
import { Bell, Check, Trash2, Archive, Settings, X } from 'lucide-react';
import { useNotifications, useRealTimeNotifications } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from './NotificationFilters';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { NotificationFilter } from '../types';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<NotificationFilter>({ limit: 10 });
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    isProcessing
  } = useNotifications(filters);

  useRealTimeNotifications();

  const unreadCount = stats?.unread || 0;

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleFilterChange = (newFilters: NotificationFilter) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors"
        aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notificações
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Filtros"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className="mt-2 text-sm text-gray-600">
                  {stats.total} total • {stats.unread} não lidas
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0 || isProcessing}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  <span>Marcar todas como lidas</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <NotificationFilters
                  filters={filters}
                  onChange={handleFilterChange}
                />
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma notificação encontrada</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification.id)}
                      onDelete={() => deleteNotification(notification.id)}
                      onArchive={() => archiveNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/dashboard/notifications';
                }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todas as notificações
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
