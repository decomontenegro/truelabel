/**
 * Rate limiter para prevenir requisições excessivas
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  constructor(private config: RateLimitConfig) {
    // Limpar entradas expiradas periodicamente
    setInterval(() => this.cleanup(), 60000); // a cada minuto
  }

  /**
   * Verifica se uma ação pode ser executada
   * @param key - Identificador único para a ação (ex: 'qr-validate-ABC123')
   * @returns true se permitido, false se bloqueado
   */
  check(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Nova janela de tempo
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false; // Limite excedido
    }

    // Incrementar contador
    entry.count++;
    return true;
  }

  /**
   * Obtém o tempo restante até o reset em segundos
   * @param key - Identificador único para a ação
   * @returns Tempo em segundos ou 0 se não há limite ativo
   */
  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const remaining = entry.resetTime - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Limpa entradas expiradas para evitar vazamento de memória
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Reseta o limite para uma chave específica
   * @param key - Identificador único para a ação
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Reseta todos os limites
   */
  resetAll(): void {
    this.limits.clear();
  }
}

// Rate limiters específicos para diferentes ações
export const qrValidationLimiter = new RateLimiter({
  maxRequests: 10, // 10 validações
  windowMs: 60000, // por minuto
});

export const apiRequestLimiter = new RateLimiter({
  maxRequests: 100, // 100 requisições
  windowMs: 60000, // por minuto
});

export const loginAttemptLimiter = new RateLimiter({
  maxRequests: 5, // 5 tentativas
  windowMs: 300000, // em 5 minutos
});

/**
 * Hook para usar rate limiting em componentes React
 */
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useRateLimiter = (
  limiter: RateLimiter,
  key: string,
  errorMessage?: string
) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState(0);

  const checkLimit = useCallback((): boolean => {
    const allowed = limiter.check(key);
    
    if (!allowed) {
      const seconds = limiter.getTimeUntilReset(key);
      setIsBlocked(true);
      setTimeUntilReset(seconds);
      
      const message = errorMessage || 
        `Muitas tentativas. Tente novamente em ${seconds} segundos.`;
      toast.error(message);
      
      // Atualizar o tempo restante a cada segundo
      const interval = setInterval(() => {
        const remaining = limiter.getTimeUntilReset(key);
        setTimeUntilReset(remaining);
        
        if (remaining === 0) {
          setIsBlocked(false);
          clearInterval(interval);
        }
      }, 1000);
      
      return false;
    }
    
    return true;
  }, [limiter, key, errorMessage]);

  const reset = useCallback(() => {
    limiter.reset(key);
    setIsBlocked(false);
    setTimeUntilReset(0);
  }, [limiter, key]);

  return {
    checkLimit,
    isBlocked,
    timeUntilReset,
    reset,
  };
};