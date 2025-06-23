import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatDateTime,
  formatFileSize,
  getStatusColor,
  getStatusText,
  truncateText,
  generateSlug,
  isValidEmail,
} from './utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
      expect(cn('text-red-500', { 'bg-blue-500': true })).toBe('text-red-500 bg-blue-500');
      expect(cn('text-red-500', { 'bg-blue-500': false })).toBe('text-red-500');
    });

    it('should handle tailwind conflicts', () => {
      expect(cn('px-4', 'px-8')).toBe('px-8');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatFileSize', () => {
    it('should format file size correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('should handle string dates', () => {
      // Considerando timezone, pode ser 14/01 ou 15/01
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/^(14|15)\/01\/2024$/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDateTime(date);
      // O formato real não inclui "às", apenas vírgula
      expect(result).toMatch(/^15\/01\/2024,?\s+10:30$/);
    });

    it('should handle string dates', () => {
      const result = formatDateTime('2024-01-15T10:30:00');
      expect(result).toMatch(/^15\/01\/2024,?\s+10:30$/);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color classes for status', () => {
      expect(getStatusColor('pending')).toBe('status-pending');
      expect(getStatusColor('validated')).toBe('status-validated');
      expect(getStatusColor('rejected')).toBe('status-rejected');
      expect(getStatusColor('expired')).toBe('status-expired');
      expect(getStatusColor('unknown')).toBe('status-pending'); // default
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for status', () => {
      expect(getStatusText('pending')).toBe('Pendente');
      expect(getStatusText('validated')).toBe('Validado');
      expect(getStatusText('rejected')).toBe('Rejeitado');
      expect(getStatusText('expired')).toBe('Expirado');
      expect(getStatusText('unknown')).toBe('unknown'); // retorna o próprio status como default
    });
  });

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
      expect(truncateText('Hello', 10)).toBe('Hello');
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from text', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Olá Mundo!')).toBe('ola-mundo');
      expect(generateSlug('Test   Multiple  Spaces')).toBe('test-multiple-spaces');
    });
  });

  describe('isValidEmail', () => {
    it('should validate email correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });
});