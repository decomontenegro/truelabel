import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let details: any = null;

  // Erro de validação Zod
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Dados inválidos';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
  }
  // Erro customizado da aplicação
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Erro do Prisma
  else if (error.message.includes('Unique constraint')) {
    statusCode = 409;
    message = 'Recurso já existe';
  }
  else if (error.message.includes('Record to update not found')) {
    statusCode = 404;
    message = 'Recurso não encontrado';
  }

  // Log do erro (em produção, usar um logger apropriado)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
