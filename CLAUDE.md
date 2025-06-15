# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

True Label is a transparent CPG (Consumer Packaged Goods) validation platform that connects product claims to accredited laboratory reports via QR codes. It's a full-stack web application marked as "100% functional" and production-ready.

## Essential Commands

### Development
```bash
# Install all dependencies (run from root)
npm run install:all

# Start both frontend and backend servers
npm run dev  # Frontend: http://localhost:9101, Backend: http://localhost:9100

# Run tests
npm test  # Runs all tests (frontend + backend)
```

### Frontend Commands (in `/client`)
```bash
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
npm test            # Run Vitest tests
```

### Backend Commands (in `/server`)
```bash
npm run dev         # Start development server with tsx
npm run build       # Compile TypeScript
npm start           # Run production server
npm run migrate     # Run Prisma migrations
npm run seed        # Seed database with test data
npm run studio      # Open Prisma Studio (database GUI)
```

### Database Management
```bash
# From /server directory
npm run generate    # Generate Prisma client after schema changes
npm run db:reset    # Reset database and re-seed
npm run migrate     # Apply pending migrations
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT with multi-role system (Admin, Brand, Laboratory, Validator)
- **Real-time**: Socket.io for notifications
- **File Storage**: Local filesystem via Multer (uploads/)

### Key Architectural Patterns

1. **API Structure**: RESTful endpoints under `/api/v1/*`
2. **Authentication**: JWT tokens stored in localStorage, middleware-protected routes
3. **State Management**: Zustand stores for auth and QR state
4. **Error Handling**: Centralized error middleware with consistent response format
5. **File Uploads**: Multer handles file uploads to `/server/uploads/`
6. **QR Code System**: Permanent QR codes with bidirectional sync between pages

### Critical Business Logic

1. **Multi-Role System**:
   - Admin: Full system access
   - Brand: Manage own products and reports
   - Laboratory: Upload analysis reports
   - Validator: Review and approve validations

2. **Product Validation Flow**:
   - Brand creates product with claims
   - Laboratory uploads analysis reports
   - System compares claims vs. lab results
   - Validator reviews and approves
   - QR code displays validated information

3. **Brazilian Seals System**: 13 categorized seals (regulatory, quality, organic, ethical, environmental) with expiration tracking

4. **Analytics**: QR scan tracking with device/browser info and export capabilities

## Development Environment Setup

```bash
# Required environment variables
# Frontend (.env in /client)
VITE_API_BASE_URL=http://localhost:9100/api/v1
VITE_QR_BASE_URL=http://localhost:9101

# Backend (.env in /server)
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
PORT=9100
```

## Test Credentials

```
Admin: admin@truelabel.com / admin123
Brand: marca@exemplo.com / marca123
Lab: analista@labexemplo.com / lab123
Validator: validador@truelabel.com / validator123
```

## Important Notes

- Always run `npm run lint` and `npm run type-check` before committing
- QR codes are permanent once generated - protect against accidental regeneration
- File uploads are stored in `/server/uploads/` - ensure directory exists
- Rate limiting is configured but can be adjusted for development
- WebSocket notifications require both servers running
- Database uses SQLite for development with automatic migration to PostgreSQL for production