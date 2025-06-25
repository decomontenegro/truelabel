import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

// Load test environment variables
dotenvConfig({ path: join(__dirname, '../../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/trustlabel_test';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

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
  
  // Create mock user
  createMockUser: (overrides = {}) => ({
    id: global.testUtils.randomString(),
    email: global.testUtils.randomEmail(),
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  // Create mock product
  createMockProduct: (overrides = {}) => ({
    id: global.testUtils.randomString(),
    name: 'Test Product',
    description: 'Test product description',
    ean: '7891234567890',
    category: 'supplement',
    status: 'pending',
    brandId: global.testUtils.randomString(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      pass,
      message: () =>
        pass
          ? expect.util.matcherHint('.not.toBeValidUUID', 'received', '') +
            '\n\n' +
            `Expected value to not be a valid UUID:\n` +
            `  ${expect.util.printReceived(received)}`
          : expect.util.matcherHint('.toBeValidUUID', 'received', '') +
            '\n\n' +
            `Expected value to be a valid UUID:\n` +
            `  ${expect.util.printReceived(received)}`,
    };
  },
  
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    
    return {
      pass,
      message: () =>
        pass
          ? expect.util.matcherHint('.not.toBeWithinRange', 'received', '') +
            '\n\n' +
            `Expected value not to be within range ${floor} - ${ceiling}:\n` +
            `  ${expect.util.printReceived(received)}`
          : expect.util.matcherHint('.toBeWithinRange', 'received', '') +
            '\n\n' +
            `Expected value to be within range ${floor} - ${ceiling}:\n` +
            `  ${expect.util.printReceived(received)}`,
    };
  },
  
  toContainObject(received: any[], expected: object) {
    const pass = received.some(item => 
      Object.keys(expected).every(key => 
        item[key] === expected[key]
      )
    );
    
    return {
      pass,
      message: () =>
        pass
          ? expect.util.matcherHint('.not.toContainObject', 'received', '') +
            '\n\n' +
            `Expected array not to contain object:\n` +
            `  ${expect.util.printExpected(expected)}`
          : expect.util.matcherHint('.toContainObject', 'received', '') +
            '\n\n' +
            `Expected array to contain object:\n` +
            `  ${expect.util.printExpected(expected)}`,
    };
  },
});

// Mock external services
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue({}),
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                valid: true,
                confidence: 0.95,
                issues: [],
              }),
            },
          }],
        }),
      },
    },
  })),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://mock-s3-url.com/file.jpg',
        Key: 'mock-key',
      }),
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('mock file content'),
      }),
    }),
  })),
}));

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
  }),
}));

// Database utilities
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clean database before each test
beforeEach(async () => {
  // Clean tables in correct order to respect foreign keys
  await prisma.$transaction([
    prisma.qRCodeScan.deleteMany(),
    prisma.qRCode.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.report.deleteMany(),
    prisma.certification.deleteMany(),
    prisma.labResult.deleteMany(),
    prisma.validation.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.laboratory.deleteMany(),
  ]);
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Global type declarations
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        randomEmail: () => string;
        randomString: (length?: number) => string;
        sleep: (ms: number) => Promise<void>;
        createMockUser: (overrides?: any) => any;
        createMockProduct: (overrides?: any) => any;
      };
    }
  }
  
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeWithinRange(floor: number, ceiling: number): R;
      toContainObject(expected: object): R;
    }
  }
}

// Export prisma for use in tests
export { prisma };