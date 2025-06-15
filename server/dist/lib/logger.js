"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.httpLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const devFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
const prodFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const transports = [
    new winston_1.default.transports.Console({
        format: env_1.config.isDevelopment ? devFormat : prodFormat
    })
];
if (!env_1.config.isDevelopment) {
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join('logs', 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        tailable: true
    }));
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join('logs', 'combined.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        tailable: true
    }));
}
const logger = winston_1.default.createLogger({
    level: env_1.config.isDevelopment ? 'debug' : 'info',
    transports,
    exitOnError: false
});
exports.httpLogger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: env_1.config.isDevelopment ? devFormat : prodFormat
        })
    ]
});
if (!env_1.config.isDevelopment) {
    exports.httpLogger.add(new winston_1.default.transports.File({
        filename: path_1.default.join('logs', 'http.log'),
        maxsize: 20 * 1024 * 1024,
        maxFiles: 5,
        tailable: true
    }));
}
exports.log = {
    info: (message, meta) => logger.info(message, meta),
    error: (message, error, meta) => {
        if (error instanceof Error) {
            logger.error(message, { ...meta, error: error.message, stack: error.stack });
        }
        else {
            logger.error(message, error);
        }
    },
    warn: (message, meta) => logger.warn(message, meta),
    debug: (message, meta) => logger.debug(message, meta),
    http: (message, meta) => exports.httpLogger.info(message, meta)
};
if (!env_1.config.isDevelopment) {
    Promise.resolve().then(() => __importStar(require('fs'))).then(fs => {
        const logsDir = path_1.default.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    });
}
exports.default = logger;
//# sourceMappingURL=logger.js.map