import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { setupRoutes } from './routes';
import { initializeServices } from './services';
import { startQueues } from './services/queue';

// Load environment variables
dotenv.config();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}

// Initialize Prisma
export const prisma = new PrismaClient();

// Create Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Export io instance for use in other modules
export { io };

// Middleware
app.use(Sentry.Handlers.requestHandler());
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TRUST LABEL API is running',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Setup routes
setupRoutes(app);

// Error handling
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-product', (productId) => {
    socket.join(`product-${productId}`);
  });

  socket.on('leave-product', (productId) => {
    socket.leave(`product-${productId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Connected to database');

    // Initialize services
    await initializeServices();
    logger.info('Services initialized');

    // Start background queues
    await startQueues();
    logger.info('Background queues started');

    // Start server
    server.listen(PORT, () => {
      logger.info(`
        ✅ TRUST LABEL API v3.0.0 is running!
        
        🌐 Server: http://localhost:${PORT}
        📊 Prisma Studio: npx prisma studio
        🔧 Environment: ${process.env.NODE_ENV}
        
        🚀 Ready to validate products with AI!
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();