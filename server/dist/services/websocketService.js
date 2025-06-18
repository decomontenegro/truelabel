"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validationQueueService_1 = __importDefault(require("./validationQueueService"));
const env_1 = require("../config/env");
class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
        this.userRooms = new Map();
        this.connectionStats = {
            totalConnections: 0,
            activeConnections: 0,
            messagesSent: 0
        };
    }
    initialize(server) {
        if (this.io) {
            console.log('WebSocket service already initialized');
            return;
        }
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: env_1.config.corsOrigins,
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
    setupMiddleware() {
        if (!this.io)
            return;
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return next(new Error('Authentication token required'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role || 'CONSUMER';
                next();
            }
            catch (error) {
                next(new Error('Invalid authentication token'));
            }
        });
    }
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
            socket.on('join-room', (roomName) => this.handleJoinRoom(socket, roomName));
            socket.on('leave-room', (roomName) => this.handleLeaveRoom(socket, roomName));
            socket.on('subscribe-queue', () => this.handleSubscribeQueue(socket));
            socket.on('unsubscribe-queue', () => this.handleUnsubscribeQueue(socket));
            socket.on('ping', () => this.handlePing(socket));
            socket.on('disconnect', () => this.handleDisconnection(socket));
        });
    }
    setupValidationQueueListeners() {
        validationQueueService_1.default.on('queueEntryCreated', (queueEntry) => {
            this.broadcastQueueUpdate('queue-entry-created', queueEntry);
        });
        validationQueueService_1.default.on('queueEntryAssigned', (queueEntry) => {
            this.broadcastQueueUpdate('queue-entry-assigned', queueEntry);
            if (queueEntry.assignedToId) {
                this.notifyUser(queueEntry.assignedToId, 'validation-assigned', {
                    queueId: queueEntry.id,
                    productName: queueEntry.product?.name,
                    priority: queueEntry.priority
                });
            }
        });
        validationQueueService_1.default.on('queueEntryUpdated', (queueEntry) => {
            this.broadcastQueueUpdate('queue-entry-updated', queueEntry);
            if (queueEntry.status === 'COMPLETED' && queueEntry.requestedById) {
                this.notifyUser(queueEntry.requestedById, 'validation-completed', {
                    queueId: queueEntry.id,
                    productName: queueEntry.product?.name,
                    status: queueEntry.status
                });
            }
        });
    }
    handleConnection(socket) {
        if (!socket.userId)
            return;
        console.log(`🔌 User ${socket.userId} connected (${socket.userRole})`);
        this.connectedUsers.set(socket.userId, socket.id);
        this.userRooms.set(socket.userId, new Set());
        this.connectionStats.totalConnections++;
        this.connectionStats.activeConnections++;
        socket.join(`user:${socket.userId}`);
        socket.join(`role:${socket.userRole}`);
        socket.emit('connected', {
            userId: socket.userId,
            role: socket.userRole,
            timestamp: new Date().toISOString()
        });
        this.broadcastToRole('ADMIN', 'connection-stats', this.connectionStats);
    }
    handleJoinRoom(socket, roomName) {
        if (!socket.userId || !socket.userRole)
            return;
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
    handleLeaveRoom(socket, roomName) {
        if (!socket.userId)
            return;
        socket.leave(roomName);
        const userRooms = this.userRooms.get(socket.userId);
        if (userRooms) {
            userRooms.delete(roomName);
        }
        console.log(`📤 User ${socket.userId} left room: ${roomName}`);
        socket.emit('room-left', { room: roomName });
    }
    handleSubscribeQueue(socket) {
        if (socket.userRole === 'ADMIN') {
            socket.join('validation-queue');
            socket.emit('queue-subscribed');
            console.log(`📋 Admin ${socket.userId} subscribed to validation queue`);
        }
        else {
            socket.emit('error', { message: 'Insufficient permissions for queue subscription' });
        }
    }
    handleUnsubscribeQueue(socket) {
        socket.leave('validation-queue');
        socket.emit('queue-unsubscribed');
        console.log(`📋 User ${socket.userId} unsubscribed from validation queue`);
    }
    handlePing(socket) {
        socket.emit('pong', { timestamp: new Date().toISOString() });
    }
    handleDisconnection(socket) {
        if (!socket.userId)
            return;
        console.log(`🔌 User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
        this.userRooms.delete(socket.userId);
        this.connectionStats.activeConnections--;
        this.broadcastToRole('ADMIN', 'connection-stats', this.connectionStats);
    }
    broadcastQueueUpdate(eventType, queueEntry) {
        if (!this.io)
            return;
        const payload = {
            type: eventType,
            data: queueEntry,
            timestamp: new Date().toISOString()
        };
        this.io.to('validation-queue').emit('queue-update', payload);
        if (queueEntry.requestedById) {
            this.notifyUser(queueEntry.requestedById, eventType, payload);
        }
        if (queueEntry.assignedToId) {
            this.notifyUser(queueEntry.assignedToId, eventType, payload);
        }
        this.connectionStats.messagesSent++;
    }
    notifyUser(userId, eventType, data) {
        if (!this.io)
            return;
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
    broadcastToRole(role, eventType, data) {
        if (!this.io)
            return;
        this.io.to(`role:${role}`).emit(eventType, {
            data,
            timestamp: new Date().toISOString()
        });
        this.connectionStats.messagesSent++;
    }
    broadcastToRoom(roomName, eventType, data) {
        if (!this.io)
            return;
        this.io.to(roomName).emit(eventType, {
            data,
            timestamp: new Date().toISOString()
        });
        this.connectionStats.messagesSent++;
    }
    isValidRoom(roomName, userRole) {
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
        if (roomName.startsWith('user:') || roomName.startsWith('product:')) {
            return true;
        }
        return false;
    }
    getConnectionStats() {
        return {
            ...this.connectionStats,
            connectedUsers: this.connectedUsers.size,
            activeRooms: this.io ? this.io.sockets.adapter.rooms.size : 0
        };
    }
    sendSystemAnnouncement(message, targetRole = null) {
        if (!this.io)
            return;
        const payload = {
            type: 'system-announcement',
            message,
            timestamp: new Date().toISOString()
        };
        if (targetRole) {
            this.broadcastToRole(targetRole, 'announcement', payload);
        }
        else {
            this.io.emit('announcement', payload);
        }
    }
    shutdown() {
        if (this.io) {
            console.log('🔌 Shutting down WebSocket service...');
            this.io.close();
        }
    }
}
exports.default = new WebSocketService();
//# sourceMappingURL=websocketService.js.map