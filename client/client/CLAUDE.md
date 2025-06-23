# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Check TypeScript types
npm run type-check

# Run linting
npm run lint

# Preview production build
npm run preview
```

# Run tests
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage

## Architecture Overview

### Technology Stack
- **React 18.2** with TypeScript (strict mode)
- **Vite** for fast builds and HMR
- **Zustand** for state management with localStorage persistence
- **React Router v6** for routing
- **Tailwind CSS** for styling
- **Axios** with interceptors for API calls
- **React Hook Form** for forms
- **React Query** for server state

### Project Structure
```
src/
├── components/      # Reusable UI components organized by feature
├── pages/          # Route-based page components
├── services/       # API service layer (always use these for API calls)
├── stores/         # Zustand stores (authStore, qrStore)
├── hooks/          # Custom hooks (useAsyncAction, useQRCode, etc.)
├── types/          # TypeScript interfaces
└── config/         # Environment and app configuration
```

### Key Architectural Patterns

1. **API Layer**: All API calls go through `services/api.ts` which handles:
   - Automatic token injection
   - Global error handling with toast notifications
   - 401 auto-logout
   - File upload/download helpers

2. **Authentication Flow**:
   - JWT stored in `authStore` with localStorage persistence
   - Token auto-verification on app load
   - Protected routes using `ProtectedRoute` component
   - Role-based access control

3. **State Management**:
   - `authStore`: User authentication state
   - `qrStore`: QR code generation and caching
   - Use existing stores rather than creating new ones when possible

4. **Routing Structure**:
   - Public routes: Landing pages and validation
   - Auth routes: Login/register
   - Dashboard routes: Protected authenticated features
   - Three layout contexts: PublicLayout, AuthLayout, DashboardLayout

5. **Development Patterns**:
   - Always use TypeScript interfaces from `types/`
   - Use `useAsyncAction` hook for consistent loading/error handling
   - Follow existing service patterns when adding new API endpoints
   - Maintain feature-based folder organization

### Important Configuration

- **Environment**: Centralized in `config/env.ts` with type-safe access
- **Path Aliases**: Use `@/` for `src/` imports
- **API Proxy**: Local dev proxies to `http://localhost:3000`
- **Port**: Development server runs on port 3001

### Common Tasks

When adding a new feature:
1. Create service methods in appropriate service file
2. Add TypeScript interfaces to `types/`
3. Use existing UI components from `components/ui/`
4. Follow the established routing patterns
5. Leverage existing hooks for common operations

When working with forms:
- Use React Hook Form with existing patterns
- Implement validation at form level
- Use `useAsyncAction` for submission handling

When making API calls:
- Always use the service layer
- Don't use Axios directly
- Error handling is automatic via interceptors