/**
 * WebSocket Service
 * 
 * Purpose: Handle real-time communication for validation updates
 * Dependencies: Socket.IO, JWT verification, Event handling
 * 
 * Features:
 * - Real-time validation queue updates
 * - User-specific notifications
 * - Room-based messaging
 * - Connection management
 * - Event broadcasting
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import validationQueueService from './validationQueueService';
import { config } from '../config/env';
import { UserRole } from '../types/enums';

interface ExtendedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
}

interface JwtPayload {
  userId: string;
  role?: UserRole;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, string>(); // userId -> socket.id
  private userRooms = new Map<string, Set<string>>(); // userId -> Set of room names
  private connectionStats: ConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0
  };

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    // Prevent multiple initialization
    if (this.io) {
      console.log('WebSocket service already initialized');
      return;
    }
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigins,
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupValidationQueueListeners();

    console.log('✅ WebSocket service initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket: ExtendedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role || 'CONSUMER';
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup main event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: ExtendedSocket) => {
      this.handleConnection(socket);
      
      socket.on('join-room', (roomName: string) => this.handleJoinRoom(socket, roomName));
      socket.on('leave-room', (roomName: string) => this.handleLeaveRoom(socket, roomName));
      socket.on('subscribe-queue', () => this.handleSubscribeQueue(socket));
      socket.on('unsubscribe-queue', () => this.handleUnsubscribeQueue(socket));
      socket.on('ping', () => this.handlePing(socket));
      socket.on('disconnect', () => this.handleDisconnection(socket));
    });
  }

  /**
   * Setup validation queue event listeners
   */
  private setupValidationQueueListeners(): void {
    // Listen to validation queue events
    validationQueueService.on('queueEntryCreated', (queueEntry) => {
      this.broadcastQueueUpdate('queue-entry-created', queueEntry);
    });

    validationQueueService.on('queueEntryAssigned', (queueEntry) => {
      this.broadcastQueueUpdate('queue-entry-assigned', queueEntry);
      if (queueEntry.assignedToId) {
        this.notifyUser(queueEntry.assignedToId, 'validation-assigned', {
          queueId: queueEntry.id,
          productName: queueEntry.product?.name,
          priority: queueEntry.priority
        });
      }
    });

    validationQueueService.on('queueEntryUpdated', (queueEntry) => {
      this.broadcastQueueUpdate('queue-entry-updated', queueEntry);
      
      // Notify relevant users
      if (queueEntry.status === 'COMPLETED' && queueEntry.requestedById) {
        this.notifyUser(queueEntry.requestedById, 'validation-completed', {
          queueId: queueEntry.id,
          productName: queueEntry.product?.name,
          status: queueEntry.status
        });
      }
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: ExtendedSocket): void {
    if (!socket.userId) return;

    console.log(`🔌 User ${socket.userId} connected (${socket.userRole})`);
    
    this.connectedUsers.set(socket.userId, socket.id);
    this.userRooms.set(socket.userId, new Set());
    this.connectionStats.totalConnections++;
    this.connectionStats.activeConnections++;

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Send connection confirmation
    socket.emit('connected', {
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date().toISOString()
    });

    // Broadcast connection stats to admins
    this.broadcastToRole('ADMIN', 'connection-stats', this.connectionStats);
  }

  /**
   * Handle room joining
   */
  private handleJoinRoom(socket: ExtendedSocket, roomName: string): void {
    if (!socket.userId || !socket.userRole) return;

    if (!this.isValidRoom(roomName, socket.userRole)) {
      socket.emit('error', { message: 'Invalid room or insufficient permissions' });
      return;
    }

    socket.join(roomName);
    const userRooms = this.userRooms.get(socket.userId);
    if (userRooms) {
      userRooms.add(roomName);
    }
    
    console.log(`📍 User ${socket.userId} joined room: ${roomName}`);
    socket.emit('room-joined', { room: roomName });
  }

  /**
   * Handle room leaving
   */
  private handleLeaveRoom(socket: ExtendedSocket, roomName: string): void {
    if (!socket.userId) return;

    socket.leave(roomName);
    const userRooms = this.userRooms.get(socket.userId);
    if (userRooms) {
      userRooms.delete(roomName);
    }
    
    console.log(`📤 User ${socket.userId} left room: ${roomName}`);
    socket.emit('room-left', { room: roomName });
  }

  /**
   * Handle queue subscription
   */
  private handleSubscribeQueue(socket: ExtendedSocket): void {
    if (socket.userRole === 'ADMIN') {
      socket.join('validation-queue');
      socket.emit('queue-subscribed');
      console.log(`📋 Admin ${socket.userId} subscribed to validation queue`);
    } else {
      socket.emit('error', { message: 'Insufficient permissions for queue subscription' });
    }
  }

  /**
   * Handle queue unsubscription
   */
  private handleUnsubscribeQueue(socket: ExtendedSocket): void {
    socket.leave('validation-queue');
    socket.emit('queue-unsubscribed');
    console.log(`📋 User ${socket.userId} unsubscribed from validation queue`);
  }

  /**
   * Handle ping
   */
  private handlePing(socket: Socket): void {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: ExtendedSocket): void {
    if (!socket.userId) return;

    console.log(`🔌 User ${socket.userId} disconnected`);
    
    this.connectedUsers.delete(socket.userId);
    this.userRooms.delete(socket.userId);
    this.connectionStats.activeConnections--;

    // Broadcast updated connection stats to admins
    this.broadcastToRole('ADMIN', 'connection-stats', this.connectionStats);
  }

  /**
   * Broadcast queue update to relevant users
   */
  private broadcastQueueUpdate(eventType: string, queueEntry: any): void {
    if (!this.io) return;

    const payload = {
      type: eventType,
      data: queueEntry,
      timestamp: new Date().toISOString()
    };

    // Broadcast to validation queue subscribers (admins)
    this.io.to('validation-queue').emit('queue-update', payload);

    // Notify the requester
    if (queueEntry.requestedById) {
      this.notifyUser(queueEntry.requestedById, eventType, payload);
    }

    // Notify the assigned validator if exists
    if (queueEntry.assignedToId) {
      this.notifyUser(queueEntry.assignedToId, eventType, payload);
    }

    this.connectionStats.messagesSent++;
  }

  /**
   * Notify specific user
   */
  notifyUser(userId: string, eventType: string, data: any): void {
    if (!this.io) return;

    if (this.connectedUsers.has(userId)) {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('notification', {
          type: eventType,
          data,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📢 Notification sent to user ${userId}: ${eventType}`);
        this.connectionStats.messagesSent++;
      }
    }
  }

  /**
   * Broadcast to all users with specific role
   */
  broadcastToRole(role: UserRole, eventType: string, data: any): void {
    if (!this.io) return;

    this.io.to(`role:${role}`).emit(eventType, {
      data,
      timestamp: new Date().toISOString()
    });
    
    this.connectionStats.messagesSent++;
  }

  /**
   * Broadcast to specific room
   */
  broadcastToRoom(roomName: string, eventType: string, data: any): void {
    if (!this.io) return;

    this.io.to(roomName).emit(eventType, {
      data,
      timestamp: new Date().toISOString()
    });
    
    this.connectionStats.messagesSent++;
  }

  /**
   * Validate room access based on user role
   */
  private isValidRoom(roomName: string, userRole: UserRole): boolean {
    const publicRooms = ['general', 'announcements'];
    const adminRooms = ['validation-queue', 'admin-notifications'];
    const brandRooms = ['brand-updates'];
    
    if (publicRooms.includes(roomName)) {
      return true;
    }
    
    if (userRole === 'ADMIN' && adminRooms.includes(roomName)) {
      return true;
    }
    
    if (userRole === 'BRAND' && brandRooms.includes(roomName)) {
      return true;
    }
    
    // Allow user-specific rooms
    if (roomName.startsWith('user:') || roomName.startsWith('product:')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      ...this.connectionStats,
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.io ? this.io.sockets.adapter.rooms.size : 0
    };
  }

  /**
   * Send system announcement
   */
  sendSystemAnnouncement(message: string, targetRole: UserRole | null = null): void {
    if (!this.io) return;

    const payload = {
      type: 'system-announcement',
      message,
      timestamp: new Date().toISOString()
    };

    if (targetRole) {
      this.broadcastToRole(targetRole, 'announcement', payload);
    } else {
      this.io.emit('announcement', payload);
    }
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.io) {
      console.log('🔌 Shutting down WebSocket service...');
      this.io.close();
    }
  }
}

export default new WebSocketService();