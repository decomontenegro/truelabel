import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

// Load test environment variables
dotenvConfig({ path: join(__dirname, '../.env') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.PORT = process.env.PORT || '9100';

// Global test utilities
global.testUtils = {
  // Generate random email
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  
  // Generate random string
  randomString: (length: number = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Sleep utility
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};