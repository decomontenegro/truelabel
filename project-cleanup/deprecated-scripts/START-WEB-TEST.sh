#!/bin/bash

# Quick Start Script for Web Design Testing
# This script guides you through testing the True Label web application

echo "🎨 True Label - Quick Start Web Test"
echo "===================================="
echo ""
echo "This script will help you test the True Label application"
echo "with the new ports (Backend: 5000, Frontend: 5001)"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Available Testing Options:${NC}"
echo ""
echo "1. Test Web Design (automatic browser opening)"
echo "   ./test-web-design.sh"
echo ""
echo "2. Complete Local Test (all features)"
echo "   ./test-complete-local.sh"
echo ""
echo "3. Manual Development Mode"
echo "   npm run dev"
echo ""
echo "4. Docker Compose (full stack)"
echo "   docker-compose up -d"
echo ""

echo -e "${YELLOW}Quick Actions:${NC}"
echo ""

# Function to show menu
show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1) Start Web Design Test (opens browser automatically)"
    echo "2) Run Complete Test Suite"
    echo "3) Start Development Servers Only"
    echo "4) View Design Showcase Page"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            echo -e "${GREEN}Starting Web Design Test...${NC}"
            ./test-web-design.sh
            ;;
        2)
            echo -e "${GREEN}Running Complete Test Suite...${NC}"
            ./test-complete-local.sh
            ;;
        3)
            echo -e "${GREEN}Starting Development Servers...${NC}"
            npm run dev
            ;;
        4)
            echo -e "${GREEN}Opening Design Showcase...${NC}"
            echo "Make sure servers are running first!"
            echo "Then open: http://localhost:5001/design-showcase"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open "http://localhost:5001/design-showcase"
            fi
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Invalid choice. Please try again.${NC}"
            show_menu
            ;;
    esac
}

# Main execution
echo -e "${BLUE}URLs After Starting:${NC}"
echo "Frontend: http://localhost:5001"
echo "Backend API: http://localhost:5000/api/v1"
echo "Design Showcase: http://localhost:5001/design-showcase"
echo ""

echo -e "${BLUE}Test Credentials:${NC}"
echo "Admin: admin@truelabel.com / admin123"
echo "Brand: marca@exemplo.com / marca123"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}Dependencies not installed. Installing now...${NC}"
    npm run install:all
fi

echo ""
show_menu