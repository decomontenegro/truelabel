"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Erro interno do servidor';
    let details = null;
    if (error instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Dados inválidos';
        details = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
    }
    else if (error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.message.includes('Unique constraint')) {
        statusCode = 409;
        message = 'Recurso já existe';
    }
    else if (error.message.includes('Record to update not found')) {
        statusCode = 404;
        message = 'Recurso não encontrado';
    }
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error);
    }
    res.status(statusCode).json({
        error: message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map