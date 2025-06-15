import { ValueObject } from '../base/ValueObject';
import { DomainError } from '../errors/DomainError';

interface EANProps {
  value: string;
}

export class EAN extends ValueObject<EANProps> {
  private constructor(props: EANProps) {
    super(props);
  }

  static create(ean: string): EAN {
    if (!ean || ean.trim().length === 0) {
      throw new DomainError('EAN cannot be empty');
    }

    const cleanEAN = ean.replace(/\D/g, '');

    if (!this.isValidEAN(cleanEAN)) {
      throw new DomainError(`Invalid EAN: ${ean}`);
    }

    return new EAN({ value: cleanEAN });
  }

  get value(): string {
    return this.props.value;
  }

  private static isValidEAN(ean: string): boolean {
    // EAN can be EAN-8 or EAN-13
    if (ean.length !== 8 && ean.length !== 13) {
      return false;
    }

    // All characters must be digits
    if (!/^\d+$/.test(ean)) {
      return false;
    }

    // Validate check digit
    return this.validateCheckDigit(ean);
  }

  private static validateCheckDigit(ean: string): boolean {
    const digits = ean.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === checkDigit;
  }

  format(): string {
    // Format EAN with hyphens for readability
    if (this.props.value.length === 8) {
      // EAN-8: XXXX-XXXX
      return `${this.props.value.slice(0, 4)}-${this.props.value.slice(4)}`;
    } else {
      // EAN-13: XXX-XXXX-XXXXX-X
      return `${this.props.value.slice(0, 3)}-${this.props.value.slice(3, 7)}-${this.props.value.slice(7, 12)}-${this.props.value.slice(12)}`;
    }
  }

  getCountryCode(): string {
    // First 3 digits of EAN-13 represent country/region
    if (this.props.value.length === 13) {
      const prefix = this.props.value.slice(0, 3);
      
      // Brazil country codes
      if (prefix >= '789' && prefix <= '790') {
        return 'BR';
      }
      
      // Add more country mappings as needed
      return 'UNKNOWN';
    }
    
    return 'N/A';
  }

  toString(): string {
    return this.props.value;
  }
}

// Common Brazilian EAN prefixes
export const BRAZILIAN_EAN_PREFIXES = ['789', '790'];