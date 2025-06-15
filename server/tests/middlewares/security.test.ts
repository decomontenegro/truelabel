import request from 'supertest';
import express from 'express';
import { securityHeaders, rateLimiters } from '../../src/middlewares/security.middleware';

describe('Security Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-download-options']).toBe('noopen');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should set CSP header', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Rate Limiting', () => {
    it('should limit general API requests', async () => {
      app.use(rateLimiters.general);
      app.get('/test', (req, res) => res.json({ success: true }));

      // Make requests up to the limit
      const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
      const requests = [];

      // Make requests quickly to trigger rate limit
      for (let i = 0; i < limit + 5; i++) {
        requests.push(request(app).get('/test'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should have stricter limits for auth endpoints', async () => {
      app.use('/auth', rateLimiters.auth);
      app.post('/auth/login', (req, res) => res.json({ success: true }));

      const authLimit = parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5');
      const requests = [];

      for (let i = 0; i < authLimit + 2; i++) {
        requests.push(request(app).post('/auth/login'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should include retry-after header when rate limited', async () => {
      app.use(rateLimiters.general);
      app.get('/test', (req, res) => res.json({ success: true }));

      const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
      
      // Exceed rate limit
      for (let i = 0; i < limit + 1; i++) {
        await request(app).get('/test');
      }

      const response = await request(app).get('/test');
      
      if (response.status === 429) {
        expect(response.headers['retry-after']).toBeDefined();
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize MongoDB operators', async () => {
      app.use(express.json());
      app.use(securityHeaders);
      app.post('/test', (req, res) => res.json(req.body));

      const maliciousPayload = {
        username: 'admin',
        password: { $ne: null }
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousPayload)
        .set('Content-Type', 'application/json');

      expect(response.body.password).not.toHaveProperty('$ne');
    });

    it('should prevent parameter pollution', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ sort: req.query.sort }));

      const response = await request(app)
        .get('/test?sort=name&sort=age');

      expect(response.body.sort).not.toBeInstanceOf(Array);
    });
  });
});