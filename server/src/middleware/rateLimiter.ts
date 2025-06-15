import rateLimit from 'express-rate-limit';

// Rate limiter configurável
export const rateLimiter = (maxRequests: number, windowMinutes: number) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // Converter minutos para ms
    max: maxRequests,
    message: {
      error: 'Muitas tentativas. Tente novamente mais tarde.',
      retryAfter: windowMinutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Usar IP + user ID para rate limiting mais preciso
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      return `${req.ip}-${userId}`;
    }
  });
};

// Rate limiters específicos
export const authLimiter = rateLimiter(5, 15); // 5 tentativas de login por 15 min
export const uploadLimiter = rateLimiter(10, 60); // 10 uploads por hora
export const apiLimiter = rateLimiter(100, 15); // 100 requests por 15 min
