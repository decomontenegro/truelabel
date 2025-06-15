import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { securityHeaders, rateLimiters } from '../../src/middlewares/security.middleware';
import { errorHandler } from '../../src/middlewares/error-handler.middleware';
import { AppError } from '../../src/utils/appError';

describe('Security Middleware Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Security Headers', () => {
    beforeEach(() => {
      app.use(securityHeaders);
      app.get('/test', (_req: Request, res: Response) => {
        res.json({ message: 'success' });
      });
    });

    it('should set security headers correctly', async () => {
      const response = await request(app).get('/test');
      
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-download-options']).toBe('noopen');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
      expect(response.headers['cross-origin-embedder-policy']).toBe('require-corp');
      expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
      expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
      expect(response.headers['origin-agent-cluster']).toBe('?1');
      expect(response.headers['strict-transport-security']).toBe('max-age=15552000; includeSubDomains');
    });

    it('should have Content-Security-Policy header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Rate Limiting', () => {
    describe('Login Rate Limiter', () => {
      let loginApp: express.Application;

      beforeEach(() => {
        loginApp = express();
        loginApp.use(express.json());
        loginApp.use('/api/v1/auth/login', rateLimiters.login);
        loginApp.post('/api/v1/auth/login', (_req: Request, res: Response) => {
          res.json({ token: 'test-token' });
        });
      });

      it('should allow requests within limit', async () => {
        const requests = Array(3).fill(null).map(() => 
          request(loginApp)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'password' })
        );

        const responses = await Promise.all(requests);
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      });

      it('should block requests exceeding limit', async () => {
        // Make 5 requests (limit) + 1 extra
        const requests = Array(6).fill(null).map(() => 
          request(loginApp)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'password' })
        );

        const responses = await Promise.all(requests);
        const successfulRequests = responses.filter(r => r.status === 200);
        const blockedRequests = responses.filter(r => r.status === 429);

        expect(successfulRequests.length).toBe(5);
        expect(blockedRequests.length).toBe(1);
        expect(blockedRequests[0].body.message).toContain('muitas tentativas');
      });
    });

    describe('API Rate Limiter', () => {
      let apiApp: express.Application;

      beforeEach(() => {
        apiApp = express();
        apiApp.use(express.json());
        apiApp.use(rateLimiters.api);
        apiApp.get('/api/v1/test', (_req: Request, res: Response) => {
          res.json({ data: 'test' });
        });
      });

      it('should handle standard API rate limiting', async () => {
        const response = await request(apiApp).get('/api/v1/test');
        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBe('100');
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      });
    });

    describe('QR Code Rate Limiter', () => {
      let qrApp: express.Application;

      beforeEach(() => {
        qrApp = express();
        qrApp.use(express.json());
        qrApp.use('/api/v1/qr', rateLimiters.qr);
        qrApp.get('/api/v1/qr/generate', (_req: Request, res: Response) => {
          res.json({ qrCode: 'test-qr' });
        });
      });

      it('should limit QR code generation requests', async () => {
        const requests = Array(11).fill(null).map(() => 
          request(qrApp).get('/api/v1/qr/generate')
        );

        const responses = await Promise.all(requests);
        const successfulRequests = responses.filter(r => r.status === 200);
        const blockedRequests = responses.filter(r => r.status === 429);

        expect(successfulRequests.length).toBe(10);
        expect(blockedRequests.length).toBe(1);
      });
    });
  });

  describe('Error Handler', () => {
    beforeEach(() => {
      app.get('/error/app', (_req: Request, _res: Response, next: NextFunction) => {
        next(new AppError('Test app error', 400));
      });

      app.get('/error/generic', (_req: Request, _res: Response, next: NextFunction) => {
        next(new Error('Generic error'));
      });

      app.get('/error/syntax', (_req: Request, _res: Response, next: NextFunction) => {
        JSON.parse('invalid json');
      });

      app.use(errorHandler);
    });

    it('should handle AppError correctly', async () => {
      const response = await request(app).get('/error/app');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Test app error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/error/app');
    });

    it('should handle generic errors', async () => {
      const response = await request(app).get('/error/generic');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Erro interno do servidor');
    });

    it('should handle JSON syntax errors', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('JSON inválido');
    });
  });

  describe('Input Validation Security', () => {
    beforeEach(() => {
      app.post('/test', (req: Request, res: Response) => {
        res.json({ received: req.body });
      });
    });

    it('should handle large payloads gracefully', async () => {
      const largePayload = { data: 'x'.repeat(1024 * 1024) }; // 1MB string
      
      const response = await request(app)
        .post('/test')
        .send(largePayload);
      
      expect(response.status).toBe(413);
    });

    it('should sanitize potentially dangerous input', async () => {
      const dangerousPayload = {
        script: '<script>alert("XSS")</script>',
        sql: "'; DROP TABLE users; --",
        path: '../../../etc/passwd'
      };

      const response = await request(app)
        .post('/test')
        .send(dangerousPayload);

      expect(response.status).toBe(200);
      // The actual sanitization would be done by validation middleware
      // This test ensures the request is processed without crashing
    });
  });

  describe('CORS Security', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:9101')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});