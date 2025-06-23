/**
 * Notification Hooks
 * 
 * Custom hooks para gerenciar notificações no frontend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';
import type {
  BaseNotification,
  NotificationFilter,
  NotificationStats,
  BulkNotificationAction,
  NotificationEvent
} from '../types';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'] as const,
  list: (filters: NotificationFilter) => [...NOTIFICATION_QUERY_KEYS.lists(), filters] as const,
  stats: () => [...NOTIFICATION_QUERY_KEYS.all, 'stats'] as const,
  preferences: () => [...NOTIFICATION_QUERY_KEYS.all, 'preferences'] as const,
};

/**
 * Hook principal para gerenciar notificações
 */
export function useNotifications(filters: NotificationFilter = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Query para buscar notificações
  const {
    data: notifications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Query para estatísticas
  const { data: stats } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.stats(),
    queryFn: () => notificationService.getStats(),
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });

  // Mutation para ações em lote
  const bulkActionMutation = useMutation({
    mutationFn: (action: BulkNotificationAction) => 
      notificationService.bulkAction(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
      toast.success('Ação realizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao executar ação');
    },
  });

  // Funções de conveniência
  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    if (!notifications?.notifications) return;
    
    const unreadIds = notifications.notifications
      .filter(n => n.status === 'UNREAD')
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      bulkActionMutation.mutate({
        action: 'MARK_READ',
        notificationIds: unreadIds
      });
    }
  }, [notifications, bulkActionMutation]);

  const deleteNotification = useCallback((notificationId: string) => {
    bulkActionMutation.mutate({
      action: 'DELETE',
      notificationIds: [notificationId]
    });
  }, [bulkActionMutation]);

  const archiveNotification = useCallback((notificationId: string) => {
    bulkActionMutation.mutate({
      action: 'ARCHIVE',
      notificationIds: [notificationId]
    });
  }, [bulkActionMutation]);

  return {
    notifications: notifications?.notifications || [],
    stats,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    bulkAction: bulkActionMutation.mutate,
    isProcessing: markAsReadMutation.isPending || bulkActionMutation.isPending,
  };
}

/**
 * Hook para notificações em tempo real
 */
export function useRealTimeNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewNotification = (event: NotificationEvent) => {
      if (event.type === 'NEW_NOTIFICATION') {
        // Atualizar cache
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
        
        // Mostrar toast para notificações de alta prioridade
        if (event.notification.priority === 'HIGH' || event.notification.priority === 'URGENT') {
          toast.success(event.notification.title, {
            duration: 5000,
          });
        }
      }
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, isConnected, user, queryClient]);

  return { isConnected };
}

/**
 * Hook para preferências de notificação
 */
export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: preferences, isLoading } = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.preferences(),
    queryFn: () => notificationService.getPreferences(),
    enabled: !!user,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: notificationService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.preferences() });
      toast.success('Preferências atualizadas');
    },
    onError: () => {
      toast.error('Erro ao atualizar preferências');
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
}

/**
 * Hook para estatísticas de notificação
 */
export function useNotificationStats() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.stats(),
    queryFn: () => notificationService.getStats(),
    enabled: !!user,
    refetchInterval: 60 * 1000, // Atualizar a cada minuto
  });
}
