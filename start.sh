#!/bin/bash

# True Label - Simple Development Startup Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "🚀 Starting True Label Development Environment..."

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    
    # Kill all child processes
    jobs -p | xargs kill 2>/dev/null
    
    echo -e "${GREEN}✅ Shutdown complete${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Start backend
echo -e "\n${GREEN}Starting backend on port 9100...${NC}"
cd server
npm run dev &
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 5

# Start frontend - using the actual path
echo -e "${GREEN}Starting frontend on port 5173...${NC}"
cd "../true label /client"
npm run dev &
cd "../true label"

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