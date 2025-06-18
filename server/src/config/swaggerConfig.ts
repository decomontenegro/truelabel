import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trust Label API',
      version: '1.0.0',
      description: 'API documentation for Trust Label - Transparent CPG Validation Platform',
      contact: {
        name: 'Trust Label Support',
        email: 'support@trustlabel.com',
        url: 'https://trustlabel.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.trustlabel.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
        twoFactorAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-2FA-Token',
          description: 'Two-factor authentication token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            name: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'BRAND', 'LABORATORY', 'PRESCRIBER', 'CONSUMER']
            },
            twoFactorEnabled: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            sku: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            category: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PENDING', 'VALIDATED', 'REJECTED', 'EXPIRED']
            },
            validationScore: {
              type: 'number',
              minimum: 0,
              maximum: 100
            },
            qrCode: {
              type: 'string'
            },
            brandId: {
              type: 'string',
              format: 'uuid'
            }
          }
        },
        Validation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            productId: {
              type: 'string',
              format: 'uuid'
            },
            laboratoryId: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'PARTIAL']
            },
            reportUrl: {
              type: 'string',
              format: 'uri'
            },
            validatedClaims: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  claim: { type: 'string' },
                  validated: { type: 'boolean' },
                  confidence: { type: 'number' }
                }
              }
            },
            expiresAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  message: { type: 'string' },
                  retryAfter: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management'
      },
      {
        name: 'Products',
        description: 'Product management'
      },
      {
        name: 'Validations',
        description: 'Product validation management'
      },
      {
        name: 'QR Codes',
        description: 'QR code generation and tracking'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting'
      },
      {
        name: 'Status',
        description: 'System status and health'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

// Example endpoint documentation
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               twoFactorToken:
 *                 type: string
 *                 description: Required if 2FA is enabled
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 requires2FA:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */

/**
 * @swagger
 * /auth/2fa/setup:
 *   post:
 *     summary: Setup 2FA for user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                 qrCode:
 *                   type: string
 *                   description: Base64 encoded QR code image
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, VALIDATED, REJECTED, EXPIRED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Get system status
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: System status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [operational, degraded, down]
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: { type: string }
 *                       status: { type: string }
 *                       responseTime: { type: number }
 *                       uptime: { type: number }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */