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
exports.recordMetric = exports.monitorAPICall = exports.monitorQuery = exports.profile = exports.addBreadcrumb = exports.clearUser = exports.identifyUser = exports.monitorOperation = exports.startTransaction = exports.logEvent = exports.logError = exports.sentryErrorHandler = exports.initSentry = void 0;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const initSentry = (app) => {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
            new profiling_node_1.ProfilingIntegration(),
            new Sentry.Integrations.Prisma({ client: true }),
        ],
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        release: process.env.npm_package_version,
        autoSessionTracking: true,
        integrations: [
            new Sentry.Integrations.Console({
                levels: ['error', 'warn']
            })
        ],
        beforeSend(event, hint) {
            if (event.exception) {
                const error = hint.originalException;
                if (error?.name === 'ValidationError') {
                    return null;
                }
                if (error?.status === 404) {
                    return null;
                }
                if (event.request) {
                    delete event.request.headers?.authorization;
                    delete event.request.headers?.cookie;
                    if (event.request.data) {
                        delete event.request.data.password;
                        delete event.request.data.creditCard;
                        delete event.request.data.ssn;
                    }
                }
            }
            return event;
        },
        beforeBreadcrumb(breadcrumb) {
            if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
                return null;
            }
            return breadcrumb;
        }
    });
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
};
exports.initSentry = initSentry;
exports.sentryErrorHandler = Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
        if (error.status === 500 || !error.status) {
            return true;
        }
        return false;
    }
});
const logError = (error, context) => {
    Sentry.withScope((scope) => {
        if (context) {
            scope.setContext('additional_data', context);
        }
        Sentry.captureException(error);
    });
};
exports.logError = logError;
const logEvent = (message, level = 'info', extra) => {
    Sentry.captureMessage(message, level);
    if (extra) {
        Sentry.withScope((scope) => {
            scope.setContext('extra_data', extra);
            Sentry.captureMessage(message, level);
        });
    }
};
exports.logEvent = logEvent;
const startTransaction = (name, op) => {
    return Sentry.startTransaction({
        name,
        op
    });
};
exports.startTransaction = startTransaction;
const monitorOperation = async (operationName, operation, context) => {
    const transaction = (0, exports.startTransaction)(operationName, 'operation');
    try {
        const result = await operation();
        transaction.setStatus('ok');
        return result;
    }
    catch (error) {
        transaction.setStatus('internal_error');
        (0, exports.logError)(error, { operation: operationName, ...context });
        throw error;
    }
    finally {
        transaction.finish();
    }
};
exports.monitorOperation = monitorOperation;
const identifyUser = (userId, email, role) => {
    Sentry.setUser({
        id: userId,
        email,
        role
    });
};
exports.identifyUser = identifyUser;
const clearUser = () => {
    Sentry.setUser(null);
};
exports.clearUser = clearUser;
const addBreadcrumb = (message, category, data) => {
    Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
        data,
        timestamp: Date.now() / 1000
    });
};
exports.addBreadcrumb = addBreadcrumb;
const profile = async (name, fn) => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
        op: 'function',
        description: name
    });
    try {
        const result = await fn();
        span?.setStatus('ok');
        return result;
    }
    catch (error) {
        span?.setStatus('internal_error');
        throw error;
    }
    finally {
        span?.finish();
    }
};
exports.profile = profile;
const monitorQuery = async (queryName, query) => {
    return (0, exports.profile)(`db.query.${queryName}`, query);
};
exports.monitorQuery = monitorQuery;
const monitorAPICall = async (apiName, call) => {
    return (0, exports.profile)(`http.client.${apiName}`, call);
};
exports.monitorAPICall = monitorAPICall;
const recordMetric = (name, value, unit = 'none', tags) => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    if (transaction) {
        transaction.setMeasurement(name, value, unit);
        if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
                transaction.setTag(key, value);
            });
        }
    }
};
exports.recordMetric = recordMetric;
//# sourceMappingURL=sentry.js.map