import winston from 'winston';
import path from 'path';
import { config } from '../config/env';

// Formato customizado para desenvolvimento
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Formato para produção (JSON estruturado)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configurar transports
const transports: winston.transport[] = [
  // Console sempre ativo
  new winston.transports.Console({
    format: config.isDevelopment ? devFormat : prodFormat
  })
];

// Adicionar arquivo de log em produção
if (!config.isDevelopment) {
  // Log de erros
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );

  // Log combinado
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  transports,
  exitOnError: false
});

// Logger para requisições HTTP
export const httpLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: config.isDevelopment ? devFormat : prodFormat
    })
  ]
});

// Adicionar arquivo para logs HTTP em produção
if (!config.isDevelopment) {
  httpLogger.add(
    new winston.transports.File({
      filename: path.join('logs', 'http.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 5,
      tailable: true
    })
  );
}

// Tipos de log estruturado
export interface LogMeta {
  userId?: string;
  productId?: string;
  action?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

// Métodos convenientes
export const log = {
  info: (message: string, meta?: LogMeta) => logger.info(message, meta),
  error: (message: string, error?: Error | LogMeta, meta?: LogMeta) => {
    if (error instanceof Error) {
      logger.error(message, { ...meta, error: error.message, stack: error.stack });
    } else {
      logger.error(message, error);
    }
  },
  warn: (message: string, meta?: LogMeta) => logger.warn(message, meta),
  debug: (message: string, meta?: LogMeta) => logger.debug(message, meta),
  http: (message: string, meta?: LogMeta) => httpLogger.info(message, meta)
};

// Criar diretório de logs se não existir
if (!config.isDevelopment) {
  import('fs').then(fs => {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });
}

export default logger;