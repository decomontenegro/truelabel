"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.sanitizeInputs = exports.customValidators = exports.validators = exports.sanitizers = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const validator_1 = __importDefault(require("validator"));
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.handleValidationErrors = handleValidationErrors;
exports.sanitizers = {
    sanitizeString: (value) => {
        if (typeof value !== 'string')
            return '';
        let sanitized = isomorphic_dompurify_1.default.sanitize(value, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
        });
        sanitized = sanitized.trim();
        sanitized = sanitized.replace(/\0/g, '');
        sanitized = sanitized.normalize('NFC');
        return sanitized;
    },
    sanitizeHtml: (value) => {
        if (typeof value !== 'string')
            return '';
        return isomorphic_dompurify_1.default.sanitize(value, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
            ALLOWED_ATTR: ['href', 'target'],
            ALLOW_DATA_ATTR: false,
        });
    },
    sanitizeFilename: (filename) => {
        if (typeof filename !== 'string')
            return '';
        filename = filename.replace(/^.*[\\\/]/, '');
        filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        if (filename.length > 255) {
            const ext = filename.split('.').pop();
            filename = filename.substring(0, 250) + '.' + ext;
        }
        return filename;
    },
    sanitizeUrl: (url) => {
        if (typeof url !== 'string')
            return '';
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return '';
            }
            return parsed.toString();
        }
        catch {
            return '';
        }
    },
    sanitizePhone: (phone) => {
        if (typeof phone !== 'string')
            return '';
        return phone.replace(/\D/g, '');
    },
};
exports.validators = {
    userRegistration: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .withMessage('Invalid email address')
            .normalizeEmail()
            .custom(async (email) => {
            return true;
        }),
        (0, express_validator_1.body)('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain uppercase, lowercase, number and special character'),
        (0, express_validator_1.body)('name')
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters')
            .customSanitizer(exports.sanitizers.sanitizeString),
        (0, express_validator_1.body)('company')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Company name too long')
            .customSanitizer(exports.sanitizers.sanitizeString),
    ],
    productCreation: [
        (0, express_validator_1.body)('name')
            .notEmpty()
            .withMessage('Product name is required')
            .isLength({ min: 3, max: 200 })
            .withMessage('Product name must be between 3 and 200 characters')
            .customSanitizer(exports.sanitizers.sanitizeString),
        (0, express_validator_1.body)('description')
            .optional()
            .isLength({ max: 2000 })
            .withMessage('Description too long')
            .customSanitizer(exports.sanitizers.sanitizeHtml),
        (0, express_validator_1.body)('ean')
            .optional()
            .matches(/^\d{8,13}$/)
            .withMessage('Invalid EAN code'),
        (0, express_validator_1.body)('category')
            .notEmpty()
            .withMessage('Category is required')
            .isIn(['food', 'beverage', 'supplement', 'cosmetic', 'medicine'])
            .withMessage('Invalid category'),
        (0, express_validator_1.body)('claims')
            .optional()
            .isArray()
            .withMessage('Claims must be an array')
            .custom((claims) => {
            if (!Array.isArray(claims))
                return false;
            return claims.every(claim => typeof claim === 'string' && claim.length <= 500);
        })
            .withMessage('Each claim must be a string with max 500 characters'),
        (0, express_validator_1.body)('ingredients')
            .optional()
            .isArray()
            .withMessage('Ingredients must be an array'),
        (0, express_validator_1.body)('nutritionalInfo')
            .optional()
            .isObject()
            .withMessage('Nutritional info must be an object'),
    ],
    validationRequest: [
        (0, express_validator_1.body)('productId')
            .notEmpty()
            .withMessage('Product ID is required')
            .isUUID()
            .withMessage('Invalid product ID format'),
        (0, express_validator_1.body)('laboratoryId')
            .notEmpty()
            .withMessage('Laboratory ID is required')
            .isUUID()
            .withMessage('Invalid laboratory ID format'),
        (0, express_validator_1.body)('tests')
            .isArray({ min: 1 })
            .withMessage('At least one test must be specified'),
        (0, express_validator_1.body)('priority')
            .optional()
            .isIn(['normal', 'high', 'urgent'])
            .withMessage('Invalid priority level'),
        (0, express_validator_1.body)('notes')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Notes too long')
            .customSanitizer(exports.sanitizers.sanitizeString),
    ],
    fileUpload: [
        (0, express_validator_1.body)('file')
            .custom((value, { req }) => {
            const file = req.file || req.files?.[0];
            if (!file) {
                throw new Error('File is required');
            }
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size exceeds 10MB limit');
            }
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
    searchQuery: [
        (0, express_validator_1.query)('q')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Search query must be between 2 and 100 characters')
            .customSanitizer(exports.sanitizers.sanitizeString),
        (0, express_validator_1.query)('category')
            .optional()
            .isIn(['food', 'beverage', 'supplement', 'cosmetic', 'medicine'])
            .withMessage('Invalid category'),
        (0, express_validator_1.query)('status')
            .optional()
            .isIn(['pending', 'validated', 'rejected', 'expired'])
            .withMessage('Invalid status'),
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer')
            .toInt(),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
            .toInt(),
        (0, express_validator_1.query)('sort')
            .optional()
            .matches(/^[a-zA-Z_]+:(asc|desc)$/)
            .withMessage('Invalid sort format. Use field:asc or field:desc'),
    ],
    uuidParam: (paramName) => [
        (0, express_validator_1.param)(paramName)
            .notEmpty()
            .withMessage(`${paramName} is required`)
            .isUUID()
            .withMessage(`Invalid ${paramName} format`),
    ],
    dateRange: [
        (0, express_validator_1.query)('startDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format')
            .custom((value, { req }) => {
            if (req.query.endDate && new Date(value) > new Date(req.query.endDate)) {
                throw new Error('Start date must be before end date');
            }
            return true;
        }),
        (0, express_validator_1.query)('endDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),
    ],
    brazilianDocuments: [
        (0, express_validator_1.body)('cpf')
            .optional()
            .custom((value) => {
            const cpf = value.replace(/\D/g, '');
            return cpf.length === 11;
        })
            .withMessage('Invalid CPF'),
        (0, express_validator_1.body)('cnpj')
            .optional()
            .custom((value) => {
            const cnpj = value.replace(/\D/g, '');
            return cnpj.length === 14;
        })
            .withMessage('Invalid CNPJ'),
    ],
};
exports.customValidators = {
    isBrazilianPhone: (value) => {
        const phone = value.replace(/\D/g, '');
        return /^[1-9]{2}[9]?[0-9]{8}$/.test(phone);
    },
    isStrongPassword: (password) => {
        return validator_1.default.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        });
    },
    isSafeUrl: (url) => {
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return false;
            }
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
        }
        catch {
            return false;
        }
    },
    isValidJSON: (value) => {
        try {
            JSON.parse(value);
            return true;
        }
        catch {
            return false;
        }
    },
    isBase64: (value) => {
        return validator_1.default.isBase64(value);
    },
};
const sanitizeInputs = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return exports.sanitizers.sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    };
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeInputs = sanitizeInputs;
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        (0, exports.handleValidationErrors)(req, res, next);
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.utils.js.map