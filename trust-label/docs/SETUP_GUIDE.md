# TRUST LABEL - Detailed Setup Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Initial Setup](#initial-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Docker**: v20.10.0 or higher
- **Docker Compose**: v2.0.0 or higher
- **Git**: v2.30.0 or higher

### Recommended Hardware
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **CPU**: 4 cores minimum

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/trust-label/trust-label-platform.git
cd trust-label-platform
```

### 2. Install Nx CLI (Global)
```bash
npm install -g nx
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 4. Setup Git Hooks
```bash
npm run prepare
```

## Database Configuration

### Using Docker (Recommended)
```bash
# Start PostgreSQL and other services
npm run docker:dev

# Wait for services to be ready (check logs)
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f
```

### Manual PostgreSQL Setup
If you prefer to use your own PostgreSQL instance:

1. Create a database:
```sql
CREATE DATABASE trust_label;
CREATE USER trust_user WITH PASSWORD 'trust_password';
GRANT ALL PRIVILEGES ON DATABASE trust_label TO trust_user;
```

2. Update `.env` with your database connection string

### Initialize Database Schema
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed with sample data
npm run db:seed
```

## Environment Variables

### 1. Copy Example Environment File
```bash
cp .env.example .env
```

### 2. Essential Variables to Configure

#### Database
```env
DATABASE_URL=postgresql://trust_user:trust_password@localhost:5432/trust_label
```

#### Redis
```env
REDIS_URL=redis://localhost:6379
```

#### JWT Secret (Generate a secure key)
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### S3/MinIO Configuration
For local development, MinIO is configured automatically with Docker.

#### OpenAI API (Required for AI features)
```env
OPENAI_API_KEY=sk-...your-key-here
```

### 3. Frontend-Specific Variables
Create `.env.local` in `packages/web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Running the Application

### Development Mode

#### Start All Services
```bash
# Start infrastructure (PostgreSQL, Redis, MinIO, etc.)
npm run docker:dev

# In a new terminal, start the application
npm run dev
```

This will start:
- Web (Next.js): http://localhost:3000
- API (NestJS): http://localhost:3001
- API Docs: http://localhost:3001/api/docs

#### Start Services Individually
```bash
# API only
npm run dev --workspace=@trust-label/api

# Web only
npm run dev --workspace=@trust-label/web
```

### Production Build

#### Build All Packages
```bash
npm run build
```

#### Run Production Build Locally
```bash
# Build first
npm run build

# Start API in production mode
npm run start --workspace=@trust-label/api

# In another terminal, start web
npm run start --workspace=@trust-label/web
```

## Development Workflow

### 1. Creating New Features

#### API (NestJS)
```bash
# Generate a new module
cd packages/api
nest g module features/my-feature
nest g controller features/my-feature
nest g service features/my-feature
```

#### Web (Next.js)
Create new pages in `packages/web/src/app/` following Next.js 14 conventions.

### 2. Database Migrations

#### Create a Migration
```bash
# After modifying schema.prisma
npx prisma migrate dev --name describe_your_change
```

#### Apply Migrations
```bash
npx prisma migrate deploy
```

### 3. Testing

#### Run All Tests
```bash
npm run test
```

#### Run Tests for Specific Package
```bash
npm run test --workspace=@trust-label/api
npm run test --workspace=@trust-label/web
```

#### Watch Mode
```bash
npm run test:watch --workspace=@trust-label/api
```

### 4. Code Quality

#### Linting
```bash
# Lint all packages
npm run lint

# Fix lint issues
npm run lint -- --fix
```

#### Format Code
```bash
npm run format
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. Docker Issues
```bash
# Reset Docker containers
docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

#### 3. Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify PostgreSQL logs: `docker logs trust-label-postgres`

#### 4. Node Modules Issues
```bash
# Clean and reinstall
npm run clean
npm run install:all
```

#### 5. Prisma Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset
```

### Getting Help

1. Check the [documentation](../README.md)
2. Search existing [issues](https://github.com/trust-label/trust-label-platform/issues)
3. Join our [Discord community](https://discord.gg/trust-label)
4. Contact support: support@trust-label.com

## Next Steps

1. **Explore the API**: Visit http://localhost:3001/api/docs
2. **Create a test account**: Use the web interface to register
3. **Try the validation flow**: Upload a test product and validate it
4. **Check monitoring**: Visit Kibana at http://localhost:5601

---

Happy coding! 🚀