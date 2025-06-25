/**
 * WebSocket Hook
 * 
 * Purpose: Manage WebSocket connections and real-time updates
 * Dependencies: Socket.IO Client, Authentication store
 * 
 * Features:
 * - Automatic connection management
 * - Event subscription/unsubscription
 * - Reconnection handling
 * - Authentication integration
 * - Connection status tracking
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

interface WebSocketHook {
  isConnected: boolean;
  socket: Socket | null;
  subscribe: (event: string, handler: (data: any) => void) => void;
  unsubscribe: (event: string) => void;
  emit: (event: string, data?: any) => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
  connectionStats: {
    connectedAt: Date | null;
    reconnectAttempts: number;
    lastError: string | null;
  };
}

export const useWebSocket = (): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStats, setConnectionStats] = useState({
    connectedAt: null as Date | null,
    reconnectAttempts: 0,
    lastError: null as string | null
  });

  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());
  const { token, user } = useAuthStore();

  // Initialize WebSocket connection
  const initializeConnection = useCallback(() => {
    if (!token || !user) {
      console.log('🔌 WebSocket: No token or user, skipping connection');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('🔌 WebSocket: Already connected');
      return;
    }

    try {
      console.log('🔌 WebSocket: Initializing connection...');
      
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
      
      socketRef.current = io(wsUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('✅ WebSocket: Connected successfully');
        setIsConnected(true);
        setConnectionStats(prev => ({
          ...prev,
          connectedAt: new Date(),
          reconnectAttempts: 0,
          lastError: null
        }));

        // Subscribe to validation queue updates if user is admin
        if (user.role === 'ADMIN') {
          socket.emit('subscribe-queue');
        }

        // Join user-specific room
        socket.emit('join-room', `user:${user.id}`);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket: Disconnected -', reason);
        setIsConnected(false);
        setConnectionStats(prev => ({
          ...prev,
          connectedAt: null,
          lastError: reason
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket: Connection error -', error.message);
        setConnectionStats(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1,
          lastError: error.message
        }));
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 WebSocket: Reconnected after ${attemptNumber} attempts`);
        setConnectionStats(prev => ({
          ...prev,
          reconnectAttempts: attemptNumber
        }));
      });

      // Setup event handlers that were registered before connection
      eventHandlersRef.current.forEach((handler, event) => {
        socket.on(event, handler);
      });

    } catch (error) {
      console.error('❌ WebSocket: Failed to initialize -', error);
      setConnectionStats(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [token, user]);

  // Cleanup connection
  const cleanup = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 WebSocket: Cleaning up connection');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionStats({
        connectedAt: null,
        reconnectAttempts: 0,
        lastError: null
      });
    }
  }, []);

  // Subscribe to events
  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    console.log(`📡 WebSocket: Subscribing to event '${event}'`);
    
    // Store handler for later use
    eventHandlersRef.current.set(event, handler);
    
    // If socket is connected, add listener immediately
    if (socketRef.current?.connected) {
      socketRef.current.on(event, handler);
    }
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((event: string) => {
    console.log(`📡 WebSocket: Unsubscribing from event '${event}'`);
    
    // Remove from stored handlers
    eventHandlersRef.current.delete(event);
    
    // Remove from socket if connected
    if (socketRef.current?.connected) {
      socketRef.current.off(event);
    }
  }, []);

  // Emit events
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      console.log(`📤 WebSocket: Emitting event '${event}'`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ WebSocket: Cannot emit '${event}' - not connected`);
    }
  }, []);

  // Join room
  const joinRoom = useCallback((roomName: string) => {
    if (socketRef.current?.connected) {
      console.log(`🏠 WebSocket: Joining room '${roomName}'`);
      socketRef.current.emit('join-room', roomName);
    }
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomName: string) => {
    if (socketRef.current?.connected) {
      console.log(`🚪 WebSocket: Leaving room '${roomName}'`);
      socketRef.current.emit('leave-room', roomName);
    }
  }, []);

  // Initialize connection when token/user changes
  useEffect(() => {
    if (token && user) {
      initializeConnection();
    } else {
      cleanup();
    }

    return cleanup;
  }, [token, user, initializeConnection, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    socket: socketRef.current,
    subscribe,
    unsubscribe,
    emit,
    joinRoom,
    leaveRoom,
    connectionStats
  };
};

/**
 * Hook for validation queue specific WebSocket events
 */
export const useValidationQueueWebSocket = () => {
  const { isConnected, subscribe, unsubscribe, emit } = useWebSocket();
  const [queueUpdates, setQueueUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected) {
      // Subscribe to queue-specific events
      subscribe('queue-update', (data) => {
        console.log('📋 Queue update received:', data);
        setQueueUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
      });

      subscribe('queue-entry-created', (data) => {
        console.log('📋 New queue entry:', data);
        setQueueUpdates(prev => [{ type: 'created', data }, ...prev.slice(0, 49)]);
      });

      subscribe('queue-entry-assigned', (data) => {
        console.log('📋 Queue entry assigned:', data);
        setQueueUpdates(prev => [{ type: 'assigned', data }, ...prev.slice(0, 49)]);
      });

      subscribe('queue-entry-updated', (data) => {
        console.log('📋 Queue entry updated:', data);
        setQueueUpdates(prev => [{ type: 'updated', data }, ...prev.slice(0, 49)]);
      });

      // Subscribe to queue updates
      emit('subscribe-queue');
    }

    return () => {
      unsubscribe('queue-update');
      unsubscribe('queue-entry-created');
      unsubscribe('queue-entry-assigned');
      unsubscribe('queue-entry-updated');
    };
  }, [isConnected, subscribe, unsubscribe, emit]);

  return {
    isConnected,
    queueUpdates,
    clearUpdates: () => setQueueUpdates([])
  };
};

/**
 * Hook for real-time notifications
 */
export const useNotifications = () => {
  const { isConnected, subscribe, unsubscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected) {
      subscribe('notification', (data) => {
        console.log('🔔 Notification received:', data);
        setNotifications(prev => [data, ...prev.slice(0, 19)]); // Keep last 20 notifications
      });

      subscribe('validation-assigned', (data) => {
        console.log('🔔 Validation assigned notification:', data);
        setNotifications(prev => [
          { type: 'validation-assigned', data, timestamp: new Date().toISOString() },
          ...prev.slice(0, 19)
        ]);
      });

      subscribe('validation-completed', (data) => {
        console.log('🔔 Validation completed notification:', data);
        setNotifications(prev => [
          { type: 'validation-completed', data, timestamp: new Date().toISOString() },
          ...prev.slice(0, 19)
        ]);
      });
    }

    return () => {
      unsubscribe('notification');
      unsubscribe('validation-assigned');
      unsubscribe('validation-completed');
    };
  }, [isConnected, subscribe, unsubscribe]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearAll
  };
};
