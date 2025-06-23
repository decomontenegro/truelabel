#!/bin/bash

echo "🚀 Starting True Label Application..."
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check ports
echo "Checking ports..."
check_port 3000
BACKEND_PORT_FREE=$?
check_port 3001
FRONTEND_PORT_FREE=$?

# Kill existing processes if needed
if [ $BACKEND_PORT_FREE -eq 1 ]; then
    echo "Killing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if [ $FRONTEND_PORT_FREE -eq 1 ]; then
    echo "Killing process on port 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

echo ""
echo "Starting servers..."
echo ""

# Start backend
echo "📦 Starting Backend (Port 3000)..."
cd ../server && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend (Port 3001)..."
cd ../client && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ True Label is starting!"
echo ""
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "👋 Goodbye!"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Wait for processes
wait