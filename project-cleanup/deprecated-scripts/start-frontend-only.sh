#!/bin/bash

# Frontend Only Test Script
# Starts only the frontend for design testing

echo "🎨 True Label - Frontend Only Test"
echo "================================="
echo ""
echo "Starting frontend on port 5001..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kill any existing process on port 5001 and 5173
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f "vite" || true
sleep 1

# Use absolute path for client
CLIENT_DIR="/Users/andremontenegro/true label /client"
cd "$CLIENT_DIR"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

echo -e "${BLUE}Starting frontend server...${NC}"
echo ""

# Set environment variables and start on port 5173
VITE_PORT=5173 npm run dev -- --port 5173 &
FRONTEND_PID=$!

# Wait for frontend to start
echo -n "Waiting for frontend to start"
for i in {1..15}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ Frontend started successfully!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -e "${GREEN}Frontend is running!${NC}"
echo ""
echo "📍 URLs:"
echo "   Main: http://localhost:5173"
echo "   Design Showcase: http://localhost:5173/design-showcase"
echo ""
echo "🎨 Design Pages (No Login Required):"
echo "   • Landing: http://localhost:5173/"
echo "   • Login: http://localhost:5173/auth/login"
echo "   • Register: http://localhost:5173/auth/register"
echo "   • About: http://localhost:5173/about"
echo "   • How It Works: http://localhost:5173/how-it-works"
echo "   • Pricing: http://localhost:5173/pricing"
echo "   • Contact: http://localhost:5173/contact"
echo ""
echo -e "${YELLOW}Note: Backend API calls will fail. This is for design testing only.${NC}"
echo ""

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    open "http://localhost:5173"
    sleep 1
    open "http://localhost:5173/design-showcase"
fi

echo "Press Ctrl+C to stop"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping frontend..."
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

# Keep running
wait $FRONTEND_PID