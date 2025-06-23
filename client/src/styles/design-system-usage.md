# Design System Usage Guide

## Overview

The True Label Design System provides a comprehensive set of design tokens, components, and utilities for building consistent user interfaces. This guide shows how to use the design system in your components.

## Importing Design Tokens

```typescript
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  shadows,
  componentTokens,
  semanticTokens 
} from '@/styles/design-system';
```

## Using Colors

### With Tailwind Classes

The design system extends Tailwind's color palette with semantic colors:

```tsx
// Primary colors
<div className="bg-primary-500 text-white">Primary background</div>
<div className="text-primary-600">Primary text</div>

// Semantic colors
<div className="bg-success-100 text-success-800">Success message</div>
<div className="bg-error-100 text-error-800">Error message</div>
<div className="bg-warning-100 text-warning-800">Warning message</div>
<div className="bg-info-100 text-info-800">Info message</div>

// Brand colors
<div className="bg-brand-blue">Brand blue</div>
<div className="bg-brand-lilac">Brand lilac</div>
```

### With Inline Styles

```tsx
import { colors } from '@/styles/design-system';

<div style={{ backgroundColor: colors.primary[500] }}>
  Primary colored div
</div>

<div style={{ color: colors.text.primary }}>
  Primary text color
</div>
```

## Typography

### Font Sizes

```tsx
// Using Tailwind classes
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<p className="text-base">Body text</p>
<p className="text-sm text-gray-600">Secondary text</p>
<p className="text-xs text-gray-500">Caption text</p>

// Using design tokens
import { typography } from '@/styles/design-system';

<p style={{ 
  fontSize: typography.fontSize.lg[0],
  lineHeight: typography.fontSize.lg[1].lineHeight 
}}>
  Large text with proper line height
</p>
```

### Font Weights

```tsx
<p className="font-normal">Normal weight (400)</p>
<p className="font-medium">Medium weight (500)</p>
<p className="font-semibold">Semibold weight (600)</p>
<p className="font-bold">Bold weight (700)</p>
```

## Spacing

The spacing system is based on a 4px grid:

```tsx
// Padding
<div className="p-4">16px padding all sides</div>
<div className="px-6 py-4">24px horizontal, 16px vertical</div>

// Margin
<div className="mt-8 mb-4">32px top, 16px bottom margin</div>
<div className="mx-auto">Auto horizontal margins</div>

// Gap (for flexbox/grid)
<div className="flex gap-4">16px gap between items</div>
<div className="grid grid-cols-3 gap-6">24px gap in grid</div>
```

## Border Radius

```tsx
<div className="rounded-sm">Small radius (2px)</div>
<div className="rounded">Default radius (4px)</div>
<div className="rounded-md">Medium radius (6px)</div>
<div className="rounded-lg">Large radius (8px)</div>
<div className="rounded-xl">Extra large radius (12px)</div>
<div className="rounded-full">Full radius (pill shape)</div>
```

## Shadows

```tsx
// Basic shadows
<div className="shadow-sm">Small shadow</div>
<div className="shadow">Default shadow</div>
<div className="shadow-md">Medium shadow</div>
<div className="shadow-lg">Large shadow</div>
<div className="shadow-xl">Extra large shadow</div>

// Using design tokens
import { shadows } from '@/styles/design-system';

<div style={{ boxShadow: shadows.elevation[2] }}>
  Elevation level 2
</div>
```

## Component Patterns

### Buttons

```tsx
// Primary button
<button className="btn-primary">
  Primary Action
</button>

// Secondary button
<button className="btn-secondary">
  Secondary Action
</button>

// Button sizes
<button className="btn-primary btn-sm">Small</button>
<button className="btn-primary">Medium</button>
<button className="btn-primary btn-lg">Large</button>

// Custom button using tokens
import { componentTokens } from '@/styles/design-system';

<button
  style={{
    height: componentTokens.button.height.md,
    paddingLeft: componentTokens.button.padding.md.x,
    paddingRight: componentTokens.button.padding.md.x,
  }}
  className="bg-primary-600 text-white rounded-md hover:bg-primary-700"
>
  Custom Button
</button>
```

### Cards

```tsx
<div className="card">
  <div className="card-header">
    <h3 className="text-lg font-semibold">Card Title</h3>
    <p className="text-sm text-gray-500">Card subtitle</p>
  </div>
  <div className="card-content">
    <p>Card content goes here</p>
  </div>
  <div className="card-footer">
    <button className="btn-primary btn-sm">Action</button>
  </div>
</div>
```

### Form Inputs

```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Email
    </label>
    <input 
      type="email" 
      className="input" 
      placeholder="email@example.com"
    />
  </div>
  
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Message
    </label>
    <textarea 
      className="input" 
      rows={4}
      placeholder="Your message..."
    />
  </div>
</div>
```

### Badges

```tsx
<div className="flex gap-2">
  <span className="badge badge-success">Active</span>
  <span className="badge badge-warning">Pending</span>
  <span className="badge badge-error">Expired</span>
  <span className="badge badge-info">New</span>
</div>
```

## Animations

### Built-in Animations

```tsx
// Fade in on mount
<div className="animate-fade-in">
  This content fades in
</div>

// Slide up animation
<div className="animate-slide-up">
  This slides up
</div>

// Loading spinner
<div className="loading-spinner w-8 h-8" />

// Pulse animation
<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
```

### Transitions

```tsx
// Smooth color transition
<button className="bg-primary-500 hover:bg-primary-600 transition-colors">
  Hover me
</button>

// Transform transition
<div className="transform hover:scale-105 transition-transform">
  Hover to scale
</div>

// All properties transition
<div className="hover:shadow-lg hover:bg-gray-50 transition-all">
  Multiple transitions
</div>
```

## Responsive Design

Use the breakpoint system for responsive layouts:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid */}
</div>

<p className="text-sm md:text-base lg:text-lg">
  Responsive text size
</p>

<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>
```

## Dark Mode Support

The design system includes dark mode support:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Dark mode compatible component
</div>

<button className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">
  Dark mode button
</button>
```

## Utility Functions

### Getting Colors Programmatically

```tsx
import { getColor } from '@/styles/design-system';

const primaryColor = getColor('primary.500'); // Returns: #3b82f6
const successColor = getColor('success.600'); // Returns: #16a34a
```

### Generating CSS Variables

```tsx
import { generateCSSVars } from '@/styles/design-system';

// Generate CSS custom properties
const cssVars = generateCSSVars();
// Outputs: :root { --color-primary-500: #3b82f6; ... }
```

## Best Practices

1. **Use semantic colors**: Prefer `text-primary-600` over `text-blue-600`
2. **Consistent spacing**: Use the spacing scale (4, 6, 8) instead of arbitrary values
3. **Typography hierarchy**: Use the predefined font sizes for consistency
4. **Component classes**: Use the pre-built component classes (btn, card, badge) when available
5. **Responsive design**: Always consider mobile-first approach
6. **Dark mode**: Test components in both light and dark modes
7. **Animations**: Use subtle animations; avoid overuse

## VS Code Integration

For better IntelliSense support, add this to your VS Code settings:

```json
{
  "tailwindCSS.experimental.configFile": "./tailwind.config.js",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```