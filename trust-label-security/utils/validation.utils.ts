import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Custom validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: formattedErrors,
      },
    });
  }
  
  next();
};

// Sanitization helpers
export const sanitizers = {
  // Basic string sanitization
  sanitizeString: (value: string): string => {
    if (typeof value !== 'string') return '';
    
    // Remove HTML and script tags
    let sanitized = DOMPurify.sanitize(value, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Normalize unicode
    sanitized = sanitized.normalize('NFC');
    
    return sanitized;
  },

  // Sanitize HTML content (for rich text fields)
  sanitizeHtml: (value: string): string => {
    if (typeof value !== 'string') return '';
    
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    if (typeof filename !== 'string') return '';
    
    // Remove path components
    filename = filename.replace(/^.*[\\\/]/, '');
    
    // Remove special characters
    filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Limit length
    if (filename.length > 255) {
      const ext = filename.split('.').pop();
      filename = filename.substring(0, 250) + '.' + ext;
    }
    
    return filename;
  },

  // Sanitize URL
  sanitizeUrl: (url: string): string => {
    if (typeof url !== 'string') return '';
    
    try {
      const parsed = new URL(url);
      
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      
      return parsed.toString();
    } catch {
      return '';
    }
  },

  // Sanitize phone number
  sanitizePhone: (phone: string): string => {
    if (typeof phone !== 'string') return '';
    
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  },
};

// Common validation chains
export const validators = {
  // User registration validation
  userRegistration: [
    body('email')
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail()
      .custom(async (email) => {
        // Check if email already exists (implement your logic)
        // const exists = await checkEmailExists(email);
        // if (exists) throw new Error('Email already registered');
        return true;
      }),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .customSanitizer(sanitizers.sanitizeString),
    
    body('company')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Company name too long')
      .customSanitizer(sanitizers.sanitizeString),
  ],

  // Product validation
  productCreation: [
    body('name')
      .notEmpty()
      .withMessage('Product name is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Product name must be between 3 and 200 characters')
      .customSanitizer(sanitizers.sanitizeString),
    
    body('description')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Description too long')
      .customSanitizer(sanitizers.sanitizeHtml),
    
    body('ean')
      .optional()
      .matches(/^\d{8,13}$/)
      .withMessage('Invalid EAN code'),
    
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['food', 'beverage', 'supplement', 'cosmetic', 'medicine'])
      .withMessage('Invalid category'),
    
    body('claims')
      .optional()
      .isArray()
      .withMessage('Claims must be an array')
      .custom((claims) => {
        if (!Array.isArray(claims)) return false;
        return claims.every(claim => 
          typeof claim === 'string' && claim.length <= 500
        );
      })
      .withMessage('Each claim must be a string with max 500 characters'),
    
    body('ingredients')
      .optional()
      .isArray()
      .withMessage('Ingredients must be an array'),
    
    body('nutritionalInfo')
      .optional()
      .isObject()
      .withMessage('Nutritional info must be an object'),
  ],

  // Validation request
  validationRequest: [
    body('productId')
      .notEmpty()
      .withMessage('Product ID is required')
      .isUUID()
      .withMessage('Invalid product ID format'),
    
    body('laboratoryId')
      .notEmpty()
      .withMessage('Laboratory ID is required')
      .isUUID()
      .withMessage('Invalid laboratory ID format'),
    
    body('tests')
      .isArray({ min: 1 })
      .withMessage('At least one test must be specified'),
    
    body('priority')
      .optional()
      .isIn(['normal', 'high', 'urgent'])
      .withMessage('Invalid priority level'),
    
    body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes too long')
      .customSanitizer(sanitizers.sanitizeString),
  ],

  // File upload validation
  fileUpload: [
    body('file')
      .custom((value, { req }) => {
        const file = req.file || req.files?.[0];
        
        if (!file) {
          throw new Error('File is required');
        }
        
        // Check file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size exceeds 10MB limit');
        }
        
        // Check file type
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
        ];
        
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error('Invalid file type');
        }
        
        return true;
      }),
  ],

  // Search/filter validation
  searchQuery: [
    query('q')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be between 2 and 100 characters')
      .customSanitizer(sanitizers.sanitizeString),
    
    query('category')
      .optional()
      .isIn(['food', 'beverage', 'supplement', 'cosmetic', 'medicine'])
      .withMessage('Invalid category'),
    
    query('status')
      .optional()
      .isIn(['pending', 'validated', 'rejected', 'expired'])
      .withMessage('Invalid status'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    
    query('sort')
      .optional()
      .matches(/^[a-zA-Z_]+:(asc|desc)$/)
      .withMessage('Invalid sort format. Use field:asc or field:desc'),
  ],

  // UUID parameter validation
  uuidParam: (paramName: string) => [
    param(paramName)
      .notEmpty()
      .withMessage(`${paramName} is required`)
      .isUUID()
      .withMessage(`Invalid ${paramName} format`),
  ],

  // Date range validation
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format')
      .custom((value, { req }) => {
        if (req.query.endDate && new Date(value) > new Date(req.query.endDate)) {
          throw new Error('Start date must be before end date');
        }
        return true;
      }),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
  ],

  // Brazilian document validation
  brazilianDocuments: [
    body('cpf')
      .optional()
      .custom((value) => {
        // Simple CPF validation (implement full algorithm)
        const cpf = value.replace(/\D/g, '');
        return cpf.length === 11;
      })
      .withMessage('Invalid CPF'),
    
    body('cnpj')
      .optional()
      .custom((value) => {
        // Simple CNPJ validation (implement full algorithm)
        const cnpj = value.replace(/\D/g, '');
        return cnpj.length === 14;
      })
      .withMessage('Invalid CNPJ'),
  ],
};

// Custom validators
export const customValidators = {
  // Validate Brazilian phone number
  isBrazilianPhone: (value: string): boolean => {
    const phone = value.replace(/\D/g, '');
    return /^[1-9]{2}[9]?[0-9]{8}$/.test(phone);
  },

  // Validate strong password
  isStrongPassword: (password: string): boolean => {
    return validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });
  },

  // Validate URL is safe
  isSafeUrl: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      
      // Check for localhost/private IPs (security risk)
      const hostname = parsed.hostname.toLowerCase();
      const privatePatterns = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        /^10\./,
        /^192\.168\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      ];
      
      for (const pattern of privatePatterns) {
        if (typeof pattern === 'string' ? hostname === pattern : pattern.test(hostname)) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  },

  // Validate JSON structure
  isValidJSON: (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  // Validate base64
  isBase64: (value: string): boolean => {
    return validator.isBase64(value);
  },
};

// Middleware to sanitize all string inputs
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizers.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query) as any;
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params) as any;
  }

  next();
};

// Validation middleware factory
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for errors
    handleValidationErrors(req, res, next);
  };
};