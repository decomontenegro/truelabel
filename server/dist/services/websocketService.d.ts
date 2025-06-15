import { Server as HTTPServer } from 'http';
import { UserRole } from '../types/enums';
declare class WebSocketService {
    private io;
    private connectedUsers;
    private userRooms;
    private connectionStats;
    initialize(server: HTTPServer): void;
    private setupMiddleware;
    private setupEventHandlers;
    private setupValidationQueueListeners;
    private handleConnection;
    private handleJoinRoom;
    private handleLeaveRoom;
    private handleSubscribeQueue;
    private handleUnsubscribeQueue;
    private handlePing;
    private handleDisconnection;
    private broadcastQueueUpdate;
    notifyUser(userId: string, eventType: string, data: any): void;
    broadcastToRole(role: UserRole, eventType: string, data: any): void;
    broadcastToRoom(roomName: string, eventType: string, data: any): void;
    private isValidRoom;
    getConnectionStats(): {
        connectedUsers: number;
        activeRooms: number;
        totalConnections: number;
        activeConnections: number;
        messagesSent: number;
    };
    sendSystemAnnouncement(message: string, targetRole?: UserRole | null): void;
    shutdown(): void;
}
declare const _default: WebSocketService;
export default _default;
//# sourceMappingURL=websocketService.d.ts.map