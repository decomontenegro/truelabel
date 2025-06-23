/**
 * Type definitions for the True Label Design System
 */

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950?: string;
};

export type NeutralScale = ColorScale & {
  0: string;
  1000: string;
};

export type SemanticColors = {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  error: ColorScale;
  warning: ColorScale;
  info: ColorScale;
};

export type SpacingScale = {
  [key: string]: string;
};

export type BorderRadiusScale = {
  none: string;
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
};

export type ShadowScale = {
  [key: string]: string;
};

export interface DesignSystem {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    success: ColorScale;
    error: ColorScale;
    warning: ColorScale;
    info: ColorScale;
    neutral: NeutralScale;
    brand: Record<string, string>;
    background: Record<string, string>;
    text: Record<string, string>;
    border: Record<string, string>;
  };
  typography: {
    fontFamily: Record<string, string[]>;
    fontSize: Record<string, [string, { lineHeight: string }]>;
    fontWeight: Record<string, string>;
    letterSpacing: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  animations: {
    transition: Record<string, string>;
    duration: Record<string, string>;
    timingFunction: Record<string, string>;
    keyframes: Record<string, Record<string, any>>;
    animation: Record<string, string>;
  };
  zIndex: Record<string, string>;
  breakpoints: Record<string, string>;
  tailwindExtend: any;
  componentTokens: Record<string, any>;
  semanticTokens: Record<string, any>;
  getColor: (path: string) => string;
  createCSSVar: (name: string, value: string) => string;
  generateCSSVars: () => string;
}

declare const designSystem: DesignSystem;
export default designSystem;