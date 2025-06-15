"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterConfig = void 0;
exports.rateLimiterConfig = {
    qrValidation: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Muitas requisições de validação'
    },
    qrGeneration: {
        windowMs: 60 * 60 * 1000,
        max: 50,
        message: 'Limite de geração excedido'
    }
};
//# sourceMappingURL=rateLimiterNote.js.map