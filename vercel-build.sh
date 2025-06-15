#!/bin/bash
echo "🚀 Starting True Label Vercel build..."

# Set PATH to include common Node.js locations
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "❌ Error: client directory not found!"
    echo "Please ensure the True Label application code is present."
    exit 1
fi

# Build the client application
cd client
echo "📦 Installing client dependencies..."
npm install

echo "🔨 Building client application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Client build completed successfully!"
    echo "📁 Build output in client/dist/"
else
    echo "❌ Client build failed!"
    exit 1
fi

cd ..
echo "✅ True Label build completed successfully!"