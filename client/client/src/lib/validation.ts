/**
 * Biblioteca de validação e sanitização de inputs
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitização de strings para prevenir XSS
 */
export const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

/**
 * Sanitização de HTML (permite tags seguras)
 */
export const sanitizeHTML = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
};

/**
 * Validação de email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validação de senha forte
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validação de CPF
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf[9])) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf[10])) return false;

  return true;
};

/**
 * Validação de CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cnpj[12])) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cnpj[13])) return false;

  return true;
};

/**
 * Validação de telefone brasileiro
 */
export const validatePhone = (phone: string): boolean => {
  // Remove caracteres não numéricos
  phone = phone.replace(/[^\d]/g, '');

  // Deve ter 10 ou 11 dígitos
  if (phone.length !== 10 && phone.length !== 11) return false;

  // Se tem 11 dígitos, o terceiro deve ser 9
  if (phone.length === 11 && phone[2] !== '9') return false;

  // DDD válido (11-99)
  const ddd = parseInt(phone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  return true;
};

/**
 * Validação de CEP
 */
export const validateCEP = (cep: string): boolean => {
  // Remove caracteres não numéricos
  cep = cep.replace(/[^\d]/g, '');

  return cep.length === 8;
};

/**
 * Validação de URL
 */
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validação de SKU (código de produto)
 */
export const validateSKU = (sku: string): boolean => {
  // SKU deve ter entre 3 e 50 caracteres
  if (sku.length < 3 || sku.length > 50) return false;

  // Apenas letras, números, hífens e underscores
  const skuRegex = /^[A-Za-z0-9_-]+$/;
  return skuRegex.test(sku);
};

/**
 * Validação de preço
 */
export const validatePrice = (price: string | number): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Sanitização de nome de arquivo
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove caracteres perigosos
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // Remove múltiplos pontos
    .toLowerCase();
};

/**
 * Validação de extensão de arquivo
 */
export const validateFileExtension = (
  fileName: string,
  allowedExtensions: string[]
): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  
  return allowedExtensions
    .map(ext => ext.toLowerCase().replace('.', ''))
    .includes(extension);
};

/**
 * Validação de tamanho de arquivo
 */
export const validateFileSize = (size: number, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

/**
 * Formatação de CPF
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/[^\d]/g, '');
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formatação de CNPJ
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/[^\d]/g, '');
  if (cleaned.length !== 14) return cnpj;
  
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Formatação de telefone
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/[^\d]/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Formatação de CEP
 */
export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/[^\d]/g, '');
  if (cleaned.length !== 8) return cep;
  
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Hook para validação de formulários
 */
export const useFormValidation = () => {
  const validateField = (
    fieldName: string,
    value: any,
    rules: ValidationRule[]
  ): string[] => {
    const errors: string[] = [];

    for (const rule of rules) {
      if (rule.required && !value) {
        errors.push(rule.message || `${fieldName} é obrigatório`);
        continue;
      }

      if (value && rule.validate && !rule.validate(value)) {
        errors.push(rule.message || `${fieldName} é inválido`);
      }
    }

    return errors;
  };

  const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  return {
    validateField,
    sanitizeFormData,
  };
};

interface ValidationRule {
  required?: boolean;
  validate?: (value: any) => boolean;
  message?: string;
}