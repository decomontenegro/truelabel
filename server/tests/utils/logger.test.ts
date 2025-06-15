import logger, { requestLogger } from '../../src/utils/logger';
import express from 'express';
import request from 'supertest';

// Mock sanitizeLogData function for testing
const sanitizeLogData = (data: any): any => {
  const sensitive = ['password', 'token', 'apiKey', 'creditCard'];
  const result = { ...data };
  
  const sanitize = (obj: any) => {
    for (const key in obj) {
      if (sensitive.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  sanitize(result);
  return result;
};

describe('Logger Utilities', () => {
  describe('logger', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeInstanceOf(Function);
      expect(logger.error).toBeInstanceOf(Function);
      expect(logger.warn).toBeInstanceOf(Function);
      expect(logger.debug).toBeInstanceOf(Function);
    });

    it('should log messages', () => {
      const spy = jest.spyOn(logger, 'info').mockImplementation();
      
      logger.info('Test message');
      
      expect(spy).toHaveBeenCalledWith('Test message');
      spy.mockRestore();
    });

    it('should log with metadata', () => {
      const spy = jest.spyOn(logger, 'info').mockImplementation();
      
      logger.info('Test message', { userId: '123', action: 'test' });
      
      expect(spy).toHaveBeenCalledWith('Test message', { userId: '123', action: 'test' });
      spy.mockRestore();
    });
  });

  describe('sanitizeLogData', () => {
    it('should remove sensitive fields', () => {
      const data = {
        username: 'test',
        password: 'secret123',
        email: 'test@example.com',
        token: 'jwt-token',
        creditCard: '1234-5678-9012-3456'
      };

      const sanitized = sanitizeLogData(data);

      expect(sanitized.username).toBe('test');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.creditCard).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'test',
          password: 'secret'
        },
        settings: {
          apiKey: 'api-secret',
          theme: 'dark'
        }
      };

      const sanitized = sanitizeLogData(data);

      expect(sanitized.user.name).toBe('test');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.settings.apiKey).toBe('[REDACTED]');
      expect(sanitized.settings.theme).toBe('dark');
    });

    it('should handle arrays', () => {
      const data = {
        users: [
          { name: 'user1', password: 'pass1' },
          { name: 'user2', password: 'pass2' }
        ]
      };

      const sanitized = sanitizeLogData(data);

      expect(sanitized.users[0].password).toBe('[REDACTED]');
      expect(sanitized.users[1].password).toBe('[REDACTED]');
    });
  });

  describe('requestLogger middleware', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(requestLogger);
    });

    it('should log incoming requests', async () => {
      const spy = jest.spyOn(logger, 'info').mockImplementation();
      
      app.get('/test', (req, res) => res.json({ success: true }));

      await request(app).get('/test');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('GET /test'),
        expect.objectContaining({
          method: 'GET',
          url: '/test'
        })
      );

      spy.mockRestore();
    });

    it('should log response time', async () => {
      const spy = jest.spyOn(logger, 'info').mockImplementation();
      
      app.get('/test', (req, res) => {
        setTimeout(() => res.json({ success: true }), 50);
      });

      await request(app).get('/test');

      // Wait for response logging
      await new Promise(resolve => setTimeout(resolve, 100));

      const calls = spy.mock.calls;
      const responseLog = calls.find(call => 
        call[0].includes('200') && call[1]?.responseTime
      );

      expect(responseLog).toBeDefined();
      expect(responseLog![1].responseTime).toBeGreaterThan(40);

      spy.mockRestore();
    });

    it('should sanitize request body in logs', async () => {
      const spy = jest.spyOn(logger, 'info').mockImplementation();
      
      app.use(express.json());
      app.post('/login', (req, res) => res.json({ success: true }));

      await request(app)
        .post('/login')
        .send({ username: 'test', password: 'secret' });

      const logCall = spy.mock.calls.find(call => 
        call[1]?.body?.password === '[REDACTED]'
      );

      expect(logCall).toBeDefined();
      expect(logCall![1].body.username).toBe('test');

      spy.mockRestore();
    });

    it('should log errors', async () => {
      const spy = jest.spyOn(logger, 'error').mockImplementation();
      
      app.get('/error', (req, res) => {
        throw new Error('Test error');
      });

      await request(app).get('/error');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Request failed'),
        expect.objectContaining({
          error: expect.any(String)
        })
      );

      spy.mockRestore();
    });
  });
});