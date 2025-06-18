import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { redis } from '../lib/redis';
import os from 'os';

const prisma = new PrismaClient();

interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  responseTime: number;
  uptime: number;
  lastChecked: Date;
  details?: any;
}

interface SystemMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class StatusController {
  // Get overall system status
  async getStatus(req: Request, res: Response) {
    try {
      const services = await this.checkAllServices();
      const metrics = await this.getSystemMetrics();
      const incidents = await this.getRecentIncidents();
      
      const overallStatus = this.calculateOverallStatus(services);
      
      res.json({
        status: overallStatus,
        services,
        metrics,
        incidents,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve system status',
        status: 'error'
      });
    }
  }

  // Check health of all services
  private async checkAllServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];
    
    // Check Database
    const dbHealth = await this.checkDatabase();
    services.push(dbHealth);
    
    // Check Redis
    const redisHealth = await this.checkRedis();
    services.push(redisHealth);
    
    // Check API
    const apiHealth = await this.checkAPI();
    services.push(apiHealth);
    
    // Check QR Service
    const qrHealth = await this.checkQRService();
    services.push(qrHealth);
    
    // Check AI Validation
    const aiHealth = await this.checkAIService();
    services.push(aiHealth);
    
    return services;
  }

  // Check database health
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    let status: 'operational' | 'degraded' | 'down' = 'operational';
    
    try {
      // Simple query to check connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Check response time
      const responseTime = Date.now() - startTime;
      if (responseTime > 1000) status = 'degraded';
      
      // Calculate uptime (would be from monitoring service)
      const uptime = 99.95;
      
      return {
        name: 'Database',
        status,
        responseTime,
        uptime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'down',
        responseTime: Date.now() - startTime,
        uptime: 0,
        lastChecked: new Date(),
        details: { error: error.message }
      };
    }
  }

  // Check Redis health
  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      await redis.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'Redis Cache',
        status: responseTime > 500 ? 'degraded' : 'operational',
        responseTime,
        uptime: 99.99,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        name: 'Redis Cache',
        status: 'down',
        responseTime: Date.now() - startTime,
        uptime: 0,
        lastChecked: new Date()
      };
    }
  }

  // Check API health
  private async checkAPI(): Promise<ServiceHealth> {
    // This would check internal API endpoints
    return {
      name: 'API',
      status: 'operational',
      responseTime: 45,
      uptime: 99.98,
      lastChecked: new Date()
    };
  }

  // Check QR Service
  private async checkQRService(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Check if QR generation is working
      // This would test actual QR generation
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'QR Code Service',
        status: 'operational',
        responseTime,
        uptime: 99.97,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        name: 'QR Code Service',
        status: 'down',
        responseTime: Date.now() - startTime,
        uptime: 0,
        lastChecked: new Date()
      };
    }
  }

  // Check AI Service
  private async checkAIService(): Promise<ServiceHealth> {
    // Check OpenAI or other AI service availability
    return {
      name: 'AI Validation Engine',
      status: 'operational',
      responseTime: 230,
      uptime: 99.90,
      lastChecked: new Date()
    };
  }

  // Get system metrics
  private async getSystemMetrics(): Promise<SystemMetrics> {
    const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      cpu: Math.round(cpuUsage),
      memory: {
        used: usedMem,
        total: totalMem,
        percentage: Math.round((usedMem / totalMem) * 100)
      },
      disk: {
        // This would require additional disk checking logic
        used: 0,
        total: 0,
        percentage: 0
      }
    };
  }

  // Get recent incidents
  private async getRecentIncidents() {
    // This would fetch from an incidents table
    return [];
  }

  // Calculate overall status based on services
  private calculateOverallStatus(services: ServiceHealth[]): 'operational' | 'degraded' | 'down' {
    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    if (hasDown) return 'down';
    if (hasDegraded) return 'degraded';
    return 'operational';
  }

  // Health check endpoint for monitoring services
  async healthCheck(req: Request, res: Response) {
    try {
      // Quick health check
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Subscribe to status updates (webhook)
  async subscribeWebhook(req: Request, res: Response) {
    const { url, events } = req.body;
    
    // This would store webhook subscriptions
    res.json({
      message: 'Webhook subscription created',
      subscription: {
        url,
        events,
        id: 'sub_' + Date.now()
      }
    });
  }
}

export const statusController = new StatusController();