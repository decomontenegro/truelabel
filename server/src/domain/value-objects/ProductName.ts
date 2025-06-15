import { ValueObject } from '../base/ValueObject';
import { DomainError } from '../errors/DomainError';

interface ProductNameProps {
  value: string;
}

export class ProductName extends ValueObject<ProductNameProps> {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 200;
  
  private constructor(props: ProductNameProps) {
    super(props);
  }

  static create(name: string): ProductName {
    if (!name || name.trim().length === 0) {
      throw new DomainError('Product name cannot be empty');
    }

    const trimmedName = name.trim();

    if (trimmedName.length < this.MIN_LENGTH) {
      throw new DomainError(
        `Product name must have at least ${this.MIN_LENGTH} characters`
      );
    }

    if (trimmedName.length > this.MAX_LENGTH) {
      throw new DomainError(
        `Product name cannot exceed ${this.MAX_LENGTH} characters`
      );
    }

    // Validate against prohibited characters
    if (this.containsProhibitedCharacters(trimmedName)) {
      throw new DomainError('Product name contains invalid characters');
    }

    return new ProductName({ value: this.sanitize(trimmedName) });
  }

  get value(): string {
    return this.props.value;
  }

  private static containsProhibitedCharacters(name: string): boolean {
    // Check for control characters and other invalid chars
    const prohibitedPattern = /[\x00-\x1F\x7F]/;
    return prohibitedPattern.test(name);
  }

  private static sanitize(name: string): string {
    // Remove extra spaces and normalize
    return name
      .replace(/\s+/g, ' ')
      .trim();
  }

  getSlug(): string {
    return this.props.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanumeric with hyphen
      .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens
  }

  getInitials(): string {
    const words = this.props.value.split(' ').filter(word => word.length > 0);
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }

  toString(): string {
    return this.props.value;
  }
}