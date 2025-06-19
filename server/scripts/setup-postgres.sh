#!/bin/bash

# True Label - PostgreSQL Setup Script

echo "🐘 True Label - PostgreSQL Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create a .env file with DATABASE_URL"
    exit 1
fi

# Source .env file
export $(cat .env | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not found in .env${NC}"
    echo "Please add DATABASE_URL to your .env file"
    echo "Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/truelabel\""
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL found${NC}"

# Check if PostgreSQL schema exists
if [ ! -f "prisma/schema.postgres.prisma" ]; then
    echo -e "${RED}❌ PostgreSQL schema not found${NC}"
    exit 1
fi

# Backup current schema
echo -e "${YELLOW}📁 Backing up current schema...${NC}"
cp prisma/schema.prisma prisma/schema.sqlite.backup

# Use PostgreSQL schema
echo -e "${YELLOW}🔄 Switching to PostgreSQL schema...${NC}"
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npx prisma generate

# Run migrations
echo -e "${YELLOW}🚀 Running migrations...${NC}"
npx prisma migrate deploy

# Seed database (optional)
read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    npx prisma db seed
fi

echo -e "\n${GREEN}✅ PostgreSQL setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your .env file with production values"
echo "2. Test the connection with: npx prisma studio"
echo "3. Deploy your application"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Make sure to use SSL in production"
echo "- Set up regular backups"
echo "- Monitor database performance"