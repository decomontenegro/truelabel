"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
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
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swaggerConfig.js.map