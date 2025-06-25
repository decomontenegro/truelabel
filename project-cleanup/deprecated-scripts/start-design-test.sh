#!/bin/bash

# Simple Design Test Starter
# Starts servers on ports 5000/5001 and opens browser

echo "🎨 Starting True Label Design Test"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Kill any existing processes
echo "Cleaning up ports..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
sleep 2

# Start backend
echo -e "${BLUE}Starting backend on port 5000...${NC}"
cd server
npm run dev > ../backend-test.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo -e "${BLUE}Starting frontend on port 5001...${NC}"
cd client
VITE_PORT=5001 PORT=5000 npm run dev > ../frontend-test.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for servers
echo -n "Waiting for servers to start"
for i in {1..20}; do
    if curl -s http://localhost:5000/api/v1/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ Servers started successfully!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Open browser
echo ""
echo -e "${BLUE}Opening browser...${NC}"
echo ""

# URLs to check
echo "📍 Main URLs:"
echo "   Frontend: http://localhost:5001"
echo "   Design Showcase: http://localhost:5001/design-showcase"
echo "   Backend API: http://localhost:5000/api/v1"
echo ""

# Open in browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sleep 2
    open "http://localhost:5001"
    sleep 1
    open "http://localhost:5001/design-showcase"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "http://localhost:5001" 2>/dev/null || echo "Please open: http://localhost:5001"
else
    echo "Please open in your browser:"
    echo "  http://localhost:5001"
    echo "  http://localhost:5001/design-showcase"
fi

echo ""
echo -e "${GREEN}✅ Design test is running!${NC}"
echo ""
echo "Test pages:"
echo "• Landing: http://localhost:5001/"
echo "• Design Kit: http://localhost:5001/design-showcase"
echo "• Login: http://localhost:5001/auth/login"
echo "• Register: http://localhost:5001/auth/register"
echo ""
echo "Press Ctrl+C to stop servers"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    rm -f backend-test.log frontend-test.log
    exit 0
}

trap cleanup INT TERM

# Keep running
while true; do
    sleep 1
done