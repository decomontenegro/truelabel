/**
 * True Label Design System
 * 
 * This file contains all design tokens and system configurations
 * for consistent styling across the application.
 */

// ============================================
// COLOR SYSTEM
// ============================================

export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Main brand blue
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Neutral Colors
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
    1000: '#000000',
  },

  // Brand Specific Colors
  brand: {
    blue: '#2563eb',
    'blue-light': '#3b82f6',
    'blue-dark': '#1d4ed8',
    white: '#ffffff',
    black: '#000000',
    lilac: '#c4b5fd',
    'lilac-light': '#e0e7ff',
    'lilac-dark': '#a78bfa',
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    inverse: '#111827',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    link: '#2563eb',
    'link-hover': '#1d4ed8',
  },

  // Border Colors
  border: {
    light: '#e5e7eb',
    DEFAULT: '#d1d5db',
    dark: '#9ca3af',
  },
} as const;

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
  },

  // Font Sizes with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============================================
// SPACING SYSTEM
// ============================================

export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
} as const;

// ============================================
// BORDER RADIUS SYSTEM
// ============================================

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================
// SHADOW SYSTEM
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Colored shadows
  primary: '0 4px 6px -1px rgb(37 99 235 / 0.1), 0 2px 4px -2px rgb(37 99 235 / 0.1)',
  success: '0 4px 6px -1px rgb(34 197 94 / 0.1), 0 2px 4px -2px rgb(34 197 94 / 0.1)',
  error: '0 4px 6px -1px rgb(239 68 68 / 0.1), 0 2px 4px -2px rgb(239 68 68 / 0.1)',
  
  // Elevation shadows
  elevation: {
    1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
  },
} as const;

// ============================================
// ANIMATION SYSTEM
// ============================================

export const animations = {
  // Transitions
  transition: {
    none: 'none',
    all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 150ms cubic-bezier(0.4, 0, 0.2, 1), fill 150ms cubic-bezier(0.4, 0, 0.2, 1), stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 150ms cubic-bezier(0.4, 0, 0.2, 1), fill 150ms cubic-bezier(0.4, 0, 0.2, 1), stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Duration
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  // Timing Functions
  timingFunction: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Keyframes
  keyframes: {
    spin: {
      to: { transform: 'rotate(360deg)' },
    },
    ping: {
      '75%, 100%': { transform: 'scale(2)', opacity: '0' },
    },
    pulse: {
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': {
        transform: 'translateY(0)',
        'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    slideUp: {
      '0%': { transform: 'translateY(10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      '0%': { transform: 'translateY(-10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideLeft: {
      '0%': { transform: 'translateX(10px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    slideRight: {
      '0%': { transform: 'translateX(-10px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(0.95)', opacity: '0' },
    },
  },

  // Animation Classes
  animation: {
    none: 'none',
    spin: 'spin 1s linear infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: 'bounce 1s infinite',
    'fade-in': 'fadeIn 0.5s ease-in-out',
    'fade-out': 'fadeOut 0.5s ease-in-out',
    'slide-up': 'slideUp 0.3s ease-out',
    'slide-down': 'slideDown 0.3s ease-out',
    'slide-left': 'slideLeft 0.3s ease-out',
    'slide-right': 'slideRight 0.3s ease-out',
    'scale-in': 'scaleIn 0.2s ease-out',
    'scale-out': 'scaleOut 0.2s ease-out',
    'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
} as const;

// ============================================
// Z-INDEX SYSTEM
// ============================================

export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  'modal-backdrop': '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
  notification: '1080',
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// TAILWIND EXTEND CONFIGURATION
// ============================================

export const tailwindExtend = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    neutral: colors.neutral,
    brand: colors.brand,
  },
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  fontWeight: typography.fontWeight,
  letterSpacing: typography.letterSpacing,
  lineHeight: typography.lineHeight,
  spacing: spacing,
  borderRadius: borderRadius,
  boxShadow: shadows,
  animation: animations.animation,
  keyframes: animations.keyframes,
  transitionProperty: animations.transition,
  transitionDuration: animations.duration,
  transitionTimingFunction: animations.timingFunction,
  zIndex: zIndex,
  screens: breakpoints,
};

// ============================================
// COMPONENT TOKENS
// ============================================

export const componentTokens = {
  button: {
    height: {
      sm: spacing[9],  // 36px
      md: spacing[10], // 40px
      lg: spacing[11], // 44px
    },
    padding: {
      sm: { x: spacing[3], y: spacing[2] },
      md: { x: spacing[4], y: spacing[2] },
      lg: { x: spacing[8], y: spacing[2] },
    },
    fontSize: {
      sm: typography.fontSize.xs,
      md: typography.fontSize.sm,
      lg: typography.fontSize.base,
    },
  },

  input: {
    height: {
      sm: spacing[9],  // 36px
      md: spacing[10], // 40px
      lg: spacing[11], // 44px
    },
    padding: {
      x: spacing[3],
      y: spacing[2],
    },
    fontSize: typography.fontSize.sm,
    borderRadius: borderRadius.md,
  },

  card: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    shadow: shadows.DEFAULT,
  },

  modal: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    maxWidth: {
      sm: '384px',
      md: '512px',
      lg: '768px',
      xl: '1024px',
    },
  },

  badge: {
    padding: { x: spacing[2.5], y: spacing[0.5] },
    fontSize: typography.fontSize.xs,
    borderRadius: borderRadius.full,
  },
};

// ============================================
// SEMANTIC TOKENS
// ============================================

export const semanticTokens = {
  colors: {
    background: {
      page: colors.neutral[50],
      card: colors.neutral[0],
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    text: {
      heading: colors.neutral[900],
      body: colors.neutral[700],
      muted: colors.neutral[500],
      disabled: colors.neutral[400],
    },
    
    border: {
      DEFAULT: colors.neutral[200],
      hover: colors.neutral[300],
      focus: colors.primary[500],
    },
    
    status: {
      validated: colors.success[600],
      pending: colors.warning[600],
      draft: colors.info[600],
      rejected: colors.error[600],
      expired: colors.neutral[600],
    },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a color value from the color system
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    value = value[key];
    if (!value) return '';
  }
  
  return value;
}

/**
 * Create a CSS variable from a design token
 */
export function createCSSVar(name: string, value: string): string {
  return `--${name}: ${value};`;
}

/**
 * Generate CSS custom properties from design tokens
 */
export function generateCSSVars(): string {
  const vars: string[] = [];
  
  // Generate color variables
  Object.entries(colors).forEach(([colorName, colorScale]) => {
    if (typeof colorScale === 'object') {
      Object.entries(colorScale).forEach(([shade, value]) => {
        vars.push(createCSSVar(`color-${colorName}-${shade}`, value));
      });
    }
  });
  
  // Generate spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    vars.push(createCSSVar(`spacing-${key}`, value));
  });
  
  // Generate radius variables
  Object.entries(borderRadius).forEach(([key, value]) => {
    vars.push(createCSSVar(`radius-${key}`, value));
  });
  
  return `:root {\n  ${vars.join('\n  ')}\n}`;
}

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  zIndex,
  breakpoints,
  tailwindExtend,
  componentTokens,
  semanticTokens,
  getColor,
  createCSSVar,
  generateCSSVars,
};