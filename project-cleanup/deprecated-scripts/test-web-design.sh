#!/bin/bash

# Web Design Test Script
# Tests the True Label application design in a web browser

set -e

echo "🎨 True Label - Web Design Test"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_PORT=5000
FRONTEND_PORT=5001
API_URL="http://localhost:$BACKEND_PORT/api/v1"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
sleep 2

# Function to open browser
open_browser() {
    local url=$1
    echo -e "${BLUE}Opening browser at: $url${NC}"
    
    # Detect OS and open browser accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open > /dev/null; then
            xdg-open "$url"
        elif command -v gnome-open > /dev/null; then
            gnome-open "$url"
        elif command -v firefox > /dev/null; then
            firefox "$url"
        elif command -v google-chrome > /dev/null; then
            google-chrome "$url"
        else
            echo -e "${YELLOW}Could not detect browser. Please open manually: $url${NC}"
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows
        start "$url"
    else
        echo -e "${YELLOW}Unknown OS. Please open manually: $url${NC}"
    fi
}

# Start servers
echo -e "${BLUE}Starting development servers...${NC}"
echo ""

# Start backend
echo "Starting backend on port $BACKEND_PORT..."
cd server
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend on port $FRONTEND_PORT..."
cd client
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for servers to start
echo -n "Waiting for servers to start"
STARTED=false
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" $API_URL/health | grep -q "200" && \
       curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL | grep -q "200"; then
        echo ""
        echo -e "${GREEN}✓ Servers started successfully!${NC}"
        STARTED=true
        break
    fi
    echo -n "."
    sleep 1
done

if [ "$STARTED" = false ]; then
    echo ""
    echo -e "${RED}✗ Failed to start servers${NC}"
    echo "Check logs:"
    echo "  Backend: tail -f backend.log"
    echo "  Frontend: tail -f frontend.log"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Application is running!${NC}"
echo ""
echo "URLs:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend API: $API_URL"
echo "  API Health: $API_URL/health"
echo ""

# Create design test routes
DESIGN_PAGES=(
    "/"                     "Landing Page"
    "/login"               "Login Page"
    "/register"            "Register Page"
    "/dashboard"           "Dashboard (requires login)"
    "/products"            "Products List"
    "/validations"         "Validations"
    "/privacy"             "Privacy Dashboard"
    "/admin/metrics"       "Business Metrics"
    "/validate/demo"       "QR Code Validation Demo"
)

echo -e "${BLUE}Design Test Pages:${NC}"
echo "=================="
echo ""

# Open main page first
open_browser "$FRONTEND_URL"
sleep 2

# Display all test pages
for ((i=0; i<${#DESIGN_PAGES[@]}; i+=2)); do
    ROUTE="${DESIGN_PAGES[i]}"
    DESC="${DESIGN_PAGES[i+1]}"
    echo "• $DESC"
    echo "  $FRONTEND_URL$ROUTE"
done

echo ""
echo -e "${BLUE}Test Credentials:${NC}"
echo "================"
echo "Admin:    admin@truelabel.com / admin123"
echo "Brand:    marca@exemplo.com / marca123"
echo "Lab:      analista@labexemplo.com / lab123"
echo ""

echo -e "${BLUE}Design Elements to Check:${NC}"
echo "========================"
echo "✓ Responsive layout (resize browser)"
echo "✓ Color scheme consistency"
echo "✓ Typography hierarchy"
echo "✓ Button styles and hover states"
echo "✓ Form inputs and validation"
echo "✓ Card components"
echo "✓ Navigation menu"
echo "✓ Loading states"
echo "✓ Error messages"
echo "✓ Success notifications"
echo "✓ Modal dialogs"
echo "✓ Tables and data display"
echo "✓ Charts and visualizations"
echo "✓ QR code display"
echo "✓ File upload areas"
echo ""

echo -e "${BLUE}Interactive Features:${NC}"
echo "===================="
echo "1. Try dark mode toggle (if available)"
echo "2. Test form validations"
echo "3. Upload a file (Products/Reports)"
echo "4. Generate a QR code"
echo "5. Test search functionality"
echo "6. Check mobile menu (responsive)"
echo "7. Test pagination"
echo "8. Export data (CSV/JSON)"
echo ""

echo -e "${GREEN}Servers are running. Press Ctrl+C to stop.${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    rm -f backend.log frontend.log
    echo "Cleanup complete."
    exit 0
}

# Set trap for cleanup on Ctrl+C
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done