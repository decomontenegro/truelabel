import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'True Label API',
      version: '2.0.0',
      description: 'API para plataforma de validação transparente de produtos CPG',
      contact: {
        name: 'True Label Team',
        email: 'api@truelabel.com',
        url: 'https://truelabel.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api`,
        description: 'Development server'
      },
      {
        url: 'https://api.truelabel.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtido através do login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            details: {
              type: 'object',
              description: 'Detalhes adicionais do erro'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { 
              type: 'string',
              enum: ['ADMIN', 'BRAND', 'LAB', 'CONSUMER']
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            brand: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' },
            sku: { type: 'string' },
            batchNumber: { type: 'string' },
            nutritionalInfo: { type: 'object' },
            claims: { type: 'array', items: { type: 'string' } },
            imageUrl: { type: 'string', format: 'uri' },
            qrCode: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'VALIDATED', 'REJECTED', 'EXPIRED']
            },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Validation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED', 'PARTIAL']
            },
            claimsValidated: { type: 'object' },
            summary: { type: 'string' },
            notes: { type: 'string' },
            validatedAt: { type: 'string', format: 'date-time' },
            productId: { type: 'string', format: 'uuid' },
            reportId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Report: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fileName: { type: 'string' },
            originalName: { type: 'string' },
            filePath: { type: 'string' },
            fileSize: { type: 'integer' },
            mimeType: { type: 'string' },
            analysisType: { type: 'string' },
            results: { type: 'object' },
            isVerified: { type: 'boolean' },
            verificationHash: { type: 'string' },
            productId: { type: 'string', format: 'uuid' },
            laboratoryId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Laboratory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            accreditation: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'role'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6
            },
            name: {
              type: 'string',
              minLength: 2
            },
            role: {
              type: 'string',
              enum: ['BRAND', 'LAB', 'CONSUMER'],
              default: 'BRAND'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              default: 1
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20
            },
            total: {
              type: 'integer'
            },
            pages: {
              type: 'integer'
            }
          }
        }
      },
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número da página'
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Itens por página'
        },
        sortParam: {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
            default: '-createdAt'
          },
          description: 'Campo de ordenação (use - para ordem decrescente)'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticação ausente ou inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Token não fornecido ou inválido'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Sem permissão para acessar este recurso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Sem permissão para acessar este recurso'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Recurso não encontrado'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erro de validação',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Erro de validação',
                details: {
                  field: 'Mensagem de erro específica'
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Autenticação e autorização'
      },
      {
        name: 'Products',
        description: 'Gerenciamento de produtos'
      },
      {
        name: 'Validations',
        description: 'Validações de produtos'
      },
      {
        name: 'Reports',
        description: 'Relatórios laboratoriais'
      },
      {
        name: 'Laboratories',
        description: 'Gerenciamento de laboratórios'
      },
      {
        name: 'QR Codes',
        description: 'Geração e validação de QR codes'
      },
      {
        name: 'Analytics',
        description: 'Analytics e estatísticas'
      },
      {
        name: 'Public',
        description: 'Endpoints públicos'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './src/controllers/*.ts',
    './src/controllers/*.js'
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Configuração customizada do Swagger UI
export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin-bottom: 20px }
    .swagger-ui .scheme-container { margin-bottom: 20px }
  `,
  customSiteTitle: 'True Label API Documentation',
  customfavIcon: '/favicon.ico'
};