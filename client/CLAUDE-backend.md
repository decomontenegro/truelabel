# CLAUDE.md - True Label Backend

This file provides guidance to Claude Code when working with the True Label backend codebase.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests (if configured)
npm test

# Database migrations (if applicable)
npm run migrate
```

## Architecture Overview

### Technology Stack
- **Node.js** with Express.js
- **Database**: PostgreSQL/MongoDB (check .env)
- **Authentication**: JWT tokens (stateless)
- **Port**: 3000 (development)
- **Deployment**: Railway (production)

### API Structure

Base URL: `http://localhost:3000/api`

#### Main Endpoints:
- `/api/auth/*` - Authentication (login, register, verify)
- `/api/products/*` - Product management
- `/api/qr/*` - QR code generation and validation
- `/api/validations/*` - Product validations
- `/api/reports/*` - Laboratory reports
- `/api/laboratories/*` - Laboratory management
- `/api/seals/*` - Product seals/certifications
- `/api/notifications/*` - User notifications

### Key Patterns

1. **Authentication Flow**:
   - JWT in Authorization header: `Bearer <token>`
   - Token verification middleware on protected routes
   - Role-based access: BRAND, LABORATORY, ADMIN

2. **Response Format**:
   ```json
   // Success
   { "data": {...}, "message": "Success" }
   
   // Error
   { "error": "Error message" }
   
   // Pagination
   { "data": [...], "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 } }
   ```

3. **Database Models**:
   - User (with role-based permissions)
   - Product (with brand, category, claims)
   - QRCode (unique validation codes)
   - Validation (laboratory test results)
   - Report (uploaded test documents)
   - Laboratory (testing facilities)
   - Seal (product certifications)

4. **File Upload**:
   - Use multipart/form-data
   - Max size: 10MB
   - Allowed: PDF, images, CSV, Excel

### Environment Variables

Create `.env` file with:
```
PORT=3000
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3001
```

### Common Tasks

**Adding a new endpoint:**
1. Create route in appropriate router file
2. Add controller method
3. Include validation middleware
4. Add to main router
5. Update client service file

**Debugging:**
- Check console for error logs
- Verify JWT token is valid
- Check CORS configuration
- Ensure database connection

**Testing API:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get products (with auth)
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Security Considerations
- Always validate and sanitize inputs
- Use parameterized queries for database
- Implement rate limiting on sensitive endpoints
- Hash passwords with bcrypt
- Keep JWT secret secure
- Validate file uploads

### Deployment Notes
- Production uses Railway platform
- Environment variables set in Railway dashboard
- Database migrations run automatically (if configured)
- CORS must include production client URL