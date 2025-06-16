import { VALIDATION_RULES } from '../constants';

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
}

export function isValidBarcode(barcode: string): boolean {
  return (
    barcode.length >= VALIDATION_RULES.BARCODE_MIN_LENGTH &&
    barcode.length <= VALIDATION_RULES.BARCODE_MAX_LENGTH &&
    /^\d+$/.test(barcode)
  );
}

export function isValidCNPJ(cnpj: string): boolean {
  // Remove non-digits
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validate check digits
  let sum = 0;
  let factor = 5;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 2 ? 9 : factor - 1;
  }
  
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[12]) !== digit) return false;

  sum = 0;
  factor = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 2 ? 9 : factor - 1;
  }
  
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cnpj[13]) === digit;
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidConfidence(confidence: number): boolean {
  return (
    typeof confidence === 'number' &&
    confidence >= VALIDATION_RULES.CONFIDENCE_MIN &&
    confidence <= VALIDATION_RULES.CONFIDENCE_MAX
  );
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}