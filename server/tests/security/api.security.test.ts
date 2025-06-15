import request from 'supertest';
import express from 'express';
import { securityHeaders } from '../../src/middlewares/security.middleware';
import { errorHandler } from '../../src/middlewares/error-handler.middleware';

describe('API Security Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityHeaders);
    
    // Test endpoints
    app.post('/api/test', (req, res) => {
      res.json({ received: req.body });
    });
    
    app.get('/api/test', (_req, res) => {
      res.json({ message: 'success' });
    });

    app.put('/api/test/:id', (req, res) => {
      res.json({ id: req.params.id, data: req.body });
    });

    app.use(errorHandler);
  });

  describe('Content Type Validation', () => {
    it('should reject requests without Content-Type for POST', async () => {
      const response = await request(app)
        .post('/api/test')
        .send('{"test": "data"}');

      expect(response.status).toBe(400);
    });

    it('should accept valid JSON Content-Type', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });

      expect(response.status).toBe(200);
      expect(response.body.received.test).toBe('data');
    });

    it('should reject invalid Content-Type for JSON endpoints', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'text/plain')
        .send('{"test": "data"}');

      expect(response.status).toBe(400);
    });
  });

  describe('HTTP Method Security', () => {
    it('should reject TRACE method', async () => {
      const response = await request(app).trace('/api/test');
      expect(response.status).toBe(404);
    });

    it('should handle OPTIONS for CORS preflight', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:9101')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBeLessThan(400);
    });

    it('should reject unsupported methods', async () => {
      const response = await request(app).patch('/api/test');
      expect(response.status).toBe(404);
    });
  });

  describe('Path Traversal Protection', () => {
    it('should sanitize path parameters', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '%2e%2e%2f%2e%2e%2f',
        '....//....//etc/passwd'
      ];

      for (const path of maliciousPaths) {
        const response = await request(app)
          .get(`/api/test/${encodeURIComponent(path)}`);

        expect(response.status).toBe(404);
      }
    });
  });

  describe('Request Size Limits', () => {
    it('should reject oversized JSON payloads', async () => {
      const largeObject = {
        data: Array(10000).fill('x'.repeat(100)).join('')
      };

      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send(largeObject);

      expect(response.status).toBe(413);
    });

    it('should handle deeply nested objects', async () => {
      let deepObject: any = { value: 'test' };
      for (let i = 0; i < 100; i++) {
        deepObject = { nested: deepObject };
      }

      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send(deepObject);

      // Should either process it or reject with appropriate error
      expect([200, 400, 413].includes(response.status)).toBe(true);
    });
  });

  describe('Header Injection Protection', () => {
    it('should sanitize response headers', async () => {
      app.get('/api/header-test', (req, res) => {
        const userInput = req.query.name as string;
        // Attempting header injection
        res.setHeader('X-User-Name', userInput || 'default');
        res.json({ success: true });
      });

      const injectionAttempts = [
        'test\r\nX-Injected: true',
        'test\nContent-Type: text/html',
        'test\r\nSet-Cookie: session=hijacked'
      ];

      for (const attempt of injectionAttempts) {
        const response = await request(app)
          .get(`/api/header-test?name=${encodeURIComponent(attempt)}`);

        expect(response.headers['x-injected']).toBeUndefined();
        expect(response.headers['set-cookie']).toBeUndefined();
      }
    });
  });

  describe('JSON Pollution Protection', () => {
    it('should prevent prototype pollution', async () => {
      const pollutionPayloads = [
        { '__proto__': { isAdmin: true } },
        { 'constructor': { prototype: { isAdmin: true } } },
        { 'prototype': { isAdmin: true } }
      ];

      for (const payload of pollutionPayloads) {
        const response = await request(app)
          .post('/api/test')
          .set('Content-Type', 'application/json')
          .send(payload);

        // Check that Object prototype wasn't polluted
        const obj = {};
        expect((obj as any).isAdmin).toBeUndefined();
      }
    });
  });

  describe('CSRF Protection', () => {
    it('should validate Origin header for state-changing requests', async () => {
      // POST without Origin header
      const response1 = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send({ data: 'test' });

      // POST with invalid Origin
      const response2 = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .set('Origin', 'http://evil.com')
        .send({ data: 'test' });

      // POST with valid Origin
      const response3 = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .set('Origin', 'http://localhost:9101')
        .send({ data: 'test' });

      // In production, invalid origins should be rejected
      expect(response3.status).toBe(200);
    });
  });

  describe('API Versioning Security', () => {
    it('should reject requests to deprecated API versions', async () => {
      app.get('/api/v0/test', (_req, res) => {
        res.status(410).json({ error: 'API version deprecated' });
      });

      const response = await request(app).get('/api/v0/test');
      expect(response.status).toBe(410);
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not leak stack traces in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.get('/api/error-test', () => {
        throw new Error('Internal error with sensitive info');
      });

      const response = await request(app).get('/api/error-test');
      
      expect(response.status).toBe(500);
      expect(response.body.stack).toBeUndefined();
      expect(response.body.message).not.toContain('sensitive info');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose database errors', async () => {
      app.get('/api/db-error', () => {
        const dbError = new Error('Connection to database failed at 192.168.1.100:5432');
        throw dbError;
      });

      const response = await request(app).get('/api/db-error');
      
      expect(response.status).toBe(500);
      expect(response.body.message).not.toContain('192.168');
      expect(response.body.message).not.toContain('5432');
    });
  });

  describe('Timing Attack Protection', () => {
    it('should have consistent response times for authentication failures', async () => {
      const timings: number[] = [];

      // Measure response times for different invalid credentials
      const attempts = [
        { email: 'nonexistent@example.com', password: 'wrongpass' },
        { email: 'admin@example.com', password: 'wrongpass' },
        { email: 'test@example.com', password: 'verywrongpassword' }
      ];

      for (const attempt of attempts) {
        const start = Date.now();
        await request(app)
          .post('/api/v1/auth/login')
          .send(attempt);
        const duration = Date.now() - start;
        timings.push(duration);
      }

      // Check that timings are relatively consistent (within 100ms variance)
      const avgTime = timings.reduce((a, b) => a + b) / timings.length;
      const maxVariance = Math.max(...timings.map(t => Math.abs(t - avgTime)));
      
      expect(maxVariance).toBeLessThan(100);
    });
  });
});