import request from 'supertest';
import express from 'express';
import { errorHandler, notFoundHandler } from '../../src/middlewares/error-handler.middleware';
import { AppError, ValidationError, UnauthorizedError } from '../../src/errors/app-errors';

describe('Error Handler Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('notFoundHandler', () => {
    it('should return 404 for non-existent routes', async () => {
      app.use(notFoundHandler);

      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
      expect(response.body.path).toBe('/non-existent-route');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError instances', async () => {
      app.get('/test', (req, res, next) => {
        next(new AppError('Test error', 400, 'TEST_ERROR'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Test error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should handle ValidationError', async () => {
      app.get('/test', (req, res, next) => {
        next(new ValidationError('Invalid input'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
      expect(response.body.type).toBe('ValidationError');
    });

    it('should handle UnauthorizedError', async () => {
      app.get('/test', (req, res, next) => {
        next(new UnauthorizedError('Invalid token'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should handle generic errors', async () => {
      app.get('/test', (req, res, next) => {
        next(new Error('Generic error'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle string errors', async () => {
      app.get('/test', (req, res, next) => {
        next('String error');
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      app.get('/test', (req, res, next) => {
        next(new Error('Test error'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body).toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.get('/test', (req, res, next) => {
        next(new Error('Test error'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body).not.toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle JSON parsing errors', async () => {
      app.use(express.json());
      app.post('/test', (req, res) => res.json({ success: true }));
      app.use(errorHandler);

      const response = await request(app)
        .post('/test')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('JSON');
    });
  });
});