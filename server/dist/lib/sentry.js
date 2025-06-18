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
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureException = exports.sentryErrorHandler = exports.sentryTracingHandler = exports.sentryRequestHandler = void 0;
exports.initSentry = initSentry;
exports.captureError = captureError;
exports.captureMessage = captureMessage;
exports.addBreadcrumb = addBreadcrumb;
exports.setUser = setUser;
exports.startTransaction = startTransaction;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const env_1 = require("../config/env");
function initSentry(app) {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn) {
        console.log('🔍 Sentry não inicializado (desenvolvimento ou sem DSN)');
        return;
    }
    try {
        Sentry.init({
            dsn: env_1.config.monitoring.sentryDsn,
            environment: env_1.config.NODE_ENV,
            integrations: [
                Sentry.httpIntegration({ tracing: true }),
                Sentry.expressIntegration({ app }),
                (0, profiling_node_1.nodeProfilingIntegration)(),
                Sentry.prismaIntegration(),
            ],
            tracesSampleRate: env_1.config.isDevelopment ? 1.0 : 0.1,
            profilesSampleRate: env_1.config.isDevelopment ? 1.0 : 0.1,
            beforeSend(event, hint) {
                const error = hint.originalException;
                if (error && error instanceof Error) {
                    if (error.name === 'ValidationError') {
                        return null;
                    }
                    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
                        return null;
                    }
                }
                if (event.request) {
                    if (event.request.headers) {
                        delete event.request.headers['authorization'];
                        delete event.request.headers['cookie'];
                        delete event.request.headers['x-api-key'];
                    }
                    if (event.request.data) {
                        delete event.request.data.password;
                        delete event.request.data.senha;
                        delete event.request.data.token;
                        delete event.request.data.jwt;
                    }
                }
                return event;
            },
            beforeTransaction(transaction) {
                if (transaction.name === 'GET /health') {
                    return null;
                }
                if (transaction.name?.includes('/static/') || transaction.name?.includes('/uploads/')) {
                    return null;
                }
                return transaction;
            },
        });
        console.log('✅ Sentry inicializado com sucesso');
    }
    catch (error) {
        console.error('❌ Erro ao inicializar Sentry:', error);
    }
}
const sentryRequestHandler = () => {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn) {
        return (req, res, next) => next();
    }
    return Sentry.Handlers.requestHandler();
};
exports.sentryRequestHandler = sentryRequestHandler;
const sentryTracingHandler = () => {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn) {
        return (req, res, next) => next();
    }
    return Sentry.Handlers.tracingHandler();
};
exports.sentryTracingHandler = sentryTracingHandler;
const sentryErrorHandler = () => {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn) {
        return (err, req, res, next) => next(err);
    }
    return Sentry.Handlers.errorHandler();
};
exports.sentryErrorHandler = sentryErrorHandler;
function captureError(error, context) {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn)
        return;
    Sentry.captureException(error, {
        contexts: {
            custom: context || {},
        },
    });
}
function captureMessage(message, level = 'info') {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn)
        return;
    Sentry.captureMessage(message, level);
}
function addBreadcrumb(breadcrumb) {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn)
        return;
    Sentry.addBreadcrumb(breadcrumb);
}
function setUser(user) {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn)
        return;
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.role,
        });
    }
    else {
        Sentry.setUser(null);
    }
}
function startTransaction(options) {
    if (!env_1.isProduction || !env_1.config.monitoring.sentryDsn) {
        return {
            setHttpStatus: () => { },
            finish: () => { }
        };
    }
    const transaction = Sentry.startInactiveSpan({
        name: options.name,
        op: options.op,
        ...options.data
    });
    return {
        setHttpStatus: (status) => {
            if (transaction) {
                transaction.setAttribute('http.status_code', status);
            }
        },
        finish: () => {
            if (transaction) {
                transaction.end();
            }
        }
    };
}
var node_1 = require("@sentry/node");
Object.defineProperty(exports, "captureException", { enumerable: true, get: function () { return node_1.captureException; } });
//# sourceMappingURL=sentry.js.map