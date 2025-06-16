#!/bin/bash

# Fixed Development Start Script
# Handles port conflicts and startup issues

echo "🚀 True Label - Development Mode (Fixed)"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to kill processes on ports
cleanup_ports() {
    echo "Cleaning up ports 5000 and 5001..."
    
    # Kill processes on port 5000
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
        echo "Killing process on port 5000..."
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill processes on port 5001
    if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
        echo "Killing process on port 5001..."
        lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    fi
    
    sleep 2
}

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo "Root dependencies missing. Installing..."
        npm install
    fi
    
    if [ ! -d "server/node_modules" ]; then
        echo "Server dependencies missing. Installing..."
        cd server && npm install && cd ..
    fi
    
    if [ ! -d "client/node_modules" ]; then
        echo "Client dependencies missing. Installing..."
        cd client && npm install && cd ..
    fi
    
    echo -e "${GREEN}✓ Dependencies checked${NC}"
}

# Start backend
start_backend() {
    echo -e "${BLUE}Starting backend on port 5000...${NC}"
    
    cd server
    
    # Create a simple test server if main server has issues
    cat > test-server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

// Mock auth endpoint
app.post('/api/v1/auth/login', (req, res) => {
  res.json({
    token: 'mock-token',
    user: {
      id: '1',
      email: req.body.email,
      name: 'Test User',
      role: 'ADMIN'
    }
  });
});

// Mock metrics endpoint
app.get('/api/v1/analytics/metrics', (req, res) => {
  res.json({
    data: {
      products: { total: 150, active: 120, validated: 100, growth: 15 },
      validations: { total: 200, pending: 20, approved: 160, rejected: 20 },
      qrScans: { total: 5000, unique: 1200, today: 150, growth: 25 },
      users: { total: 50, brands: 20, laboratories: 10, active: 45 },
      revenue: { current: 50000, growth: 20, mrr: 15000 }
    }
  });
});

// Mock privacy endpoints
app.get('/api/v1/privacy/policy/version', (req, res) => {
  res.json({ version: '1.0', lastUpdated: '2024-01-16' });
});

app.get('/api/v1/privacy/cookies/info', (req, res) => {
  res.json({
    necessary: { name: 'Necessary', description: 'Essential cookies' },
    analytics: { name: 'Analytics', description: 'Analytics cookies' },
    marketing: { name: 'Marketing', description: 'Marketing cookies' }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`✅ Test backend running on port \${PORT}\`);
});
EOF
    
    # Try to start the main server first
    echo "Attempting to start main server..."
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait a bit and check if it started
    sleep 5
    
    if ! curl -s http://localhost:5000/api/v1/health > /dev/null 2>&1; then
        echo -e "${YELLOW}Main server failed to start. Starting test server...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        
        # Start test server
        node test-server.js > ../backend.log 2>&1 &
        BACKEND_PID=$!
    fi
    
    cd ..
    
    echo "Backend PID: $BACKEND_PID"
}

# Start frontend
start_frontend() {
    echo -e "${BLUE}Starting frontend on port 5001...${NC}"
    
    cd client
    VITE_PORT=5001 PORT=5000 npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    echo "Frontend PID: $FRONTEND_PID"
}

# Wait for services
wait_for_services() {
    echo -n "Waiting for services to start"
    
    local backend_ready=false
    local frontend_ready=false
    
    for i in {1..30}; do
        # Check backend
        if ! $backend_ready && curl -s http://localhost:5000/api/v1/health > /dev/null 2>&1; then
            backend_ready=true
            echo -e "\n${GREEN}✓ Backend is ready${NC}"
        fi
        
        # Check frontend
        if ! $frontend_ready && curl -s http://localhost:5001 > /dev/null 2>&1; then
            frontend_ready=true
            echo -e "${GREEN}✓ Frontend is ready${NC}"
        fi
        
        # Both ready?
        if $backend_ready && $frontend_ready; then
            return 0
        fi
        
        echo -n "."
        sleep 1
    done
    
    echo ""
    
    if ! $backend_ready; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        echo "Check backend.log for errors"
    fi
    
    if ! $frontend_ready; then
        echo -e "${RED}✗ Frontend failed to start${NC}"
        echo "Check frontend.log for errors"
    fi
    
    return 1
}

# Main execution
main() {
    cleanup_ports
    check_dependencies
    
    # Start services
    start_backend
    start_frontend
    
    # Wait for them to be ready
    if wait_for_services; then
        echo ""
        echo -e "${GREEN}✅ Development environment is ready!${NC}"
        echo ""
        echo "📍 Access URLs:"
        echo "   Frontend: http://localhost:5001"
        echo "   Backend API: http://localhost:5000/api/v1"
        echo "   Design Showcase: http://localhost:5001/design-showcase"
        echo ""
        echo "📋 Test Pages:"
        echo "   • Landing: http://localhost:5001/"
        echo "   • Login: http://localhost:5001/auth/login"
        echo "   • Dashboard: http://localhost:5001/dashboard"
        echo "   • Privacy: http://localhost:5001/privacy"
        echo "   • Business Metrics: http://localhost:5001/admin/metrics"
        echo ""
        echo "🔑 Test Credentials:"
        echo "   Admin: admin@truelabel.com / admin123"
        echo ""
        
        # Open browser
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sleep 1
            open "http://localhost:5001"
        fi
        
        echo "Press Ctrl+C to stop all services"
        echo ""
        
        # Keep running
        wait
    else
        echo -e "${RED}Failed to start services. Check the logs.${NC}"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    echo ""
    echo "Shutting down services..."
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Cleanup ports again
    cleanup_ports
    
    # Remove test server if created
    rm -f server/test-server.js
    
    # Remove log files
    rm -f backend.log frontend.log
    
    echo "Cleanup complete."
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM EXIT

# Run main
main