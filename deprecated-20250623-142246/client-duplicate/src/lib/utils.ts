import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function formatDateTime(date: string | Date | null | undefined): string {
  // Handle null, undefined, or invalid dates
  if (!date) {
    return 'Data não informada';
  }

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'validated':
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'draft':
      return 'info';
    case 'rejected':
      return 'error';
    case 'expired':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function getStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'validated':
      return 'Validado';
    case 'pending':
      return 'Pendente';
    case 'draft':
      return 'Rascunho';
    case 'rejected':
      return 'Rejeitado';
    case 'expired':
      return 'Expirado';
    case 'approved':
      return 'Aprovado';
    case 'partial':
      return 'Parcial';
    default:
      return status;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Focus management utilities
export function manageFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
  );
  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  element.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  });

  return firstFocusableElement;
}

// Animation helper
export function animateOnScroll(selector: string, animationClass: string = 'animate-slide-up') {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(animationClass);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

// Format number with locale-specific separators
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Format percentage value
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Enhanced date formatting with custom format
export function formatDate(date: string | Date | null | undefined, format?: string): string {
  // Handle null, undefined, or invalid dates
  if (!date) {
    return 'Data não informada';
  }

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'Data inválida';
  }

  if (format === 'dd/MM') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(d);
  }

  if (format === 'dd/MM/yyyy HH:mm') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
