#!/bin/bash

# True Label - Development Quick Start Script
# This script helps you quickly start the development environment

echo "🚀 Starting True Label Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Install dependencies if needed
if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing client dependencies...${NC}"
    cd client && npm install && cd ..
fi

# Check if .env files exist
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}📝 Creating server/.env from .env.example...${NC}"
    cp .env.example server/.env
    echo -e "${GREEN}✅ server/.env created - Please update with your settings${NC}"
fi

if [ ! -f "client/.env" ]; then
    echo -e "${YELLOW}📝 Creating client/.env...${NC}"
    cat > client/.env << EOF
VITE_API_BASE_URL=http://localhost:9100/api/v1
VITE_QR_BASE_URL=http://localhost:9100
VITE_ENVIRONMENT=development
EOF
    echo -e "${GREEN}✅ client/.env created${NC}"
fi

# Setup database if needed
if [ ! -f "server/prisma/dev.db" ]; then
    echo -e "${YELLOW}🗄️  Setting up database...${NC}"
    cd server
    npx prisma generate
    npx prisma migrate dev --name init
    echo -e "${GREEN}✅ Database created${NC}"
    
    # Ask if user wants to seed
    read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run seed
        echo -e "${GREEN}✅ Database seeded${NC}"
    fi
    cd ..
fi

# Check ports
echo -e "\n${YELLOW}🔍 Checking ports...${NC}"
if ! check_port 9100; then
    echo -e "${RED}❌ Port 9100 (backend) is in use. Please stop the service using it.${NC}"
    exit 1
fi

if ! check_port 5173; then
    echo -e "${RED}❌ Port 5173 (frontend) is in use. Please stop the service using it.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ports are available${NC}"

# Start services
echo -e "\n${GREEN}🚀 Starting services...${NC}"
echo -e "${YELLOW}📡 Backend will run on: http://localhost:9100${NC}"
echo -e "${YELLOW}🌐 Frontend will run on: http://localhost:5173${NC}"
echo -e "${YELLOW}📚 API Docs will be at: http://localhost:9100/api-docs${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend in background
echo -e "${GREEN}Starting backend...${NC}"
cd server && npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 5

# Start frontend in background
echo -e "${GREEN}Starting frontend...${NC}"
cd client && npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a bit for services to fully start
sleep 3

echo -e "\n${GREEN}✨ True Label is running!${NC}"
echo -e "\n${YELLOW}Default login credentials:${NC}"
echo -e "Email: admin@truelabel.com"
echo -e "Password: Admin123!@#"
echo -e "\n${YELLOW}Quick links:${NC}"
echo -e "Frontend: http://localhost:5173"
echo -e "Backend API: http://localhost:9100"
echo -e "API Docs: http://localhost:9100/api-docs"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait