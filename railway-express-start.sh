#!/bin/bash
# Startup script for Railway - Express Server

echo "🚀 Starting Robridge Express Server"
echo "=================================="

# Navigate to Robridge web directory
cd "Robridge web" || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build React app if build directory doesn't exist
if [ ! -d "build" ]; then
    echo "🏗️  Building React application..."
    npm run build
fi

# Start the Express server
echo "🌐 Starting Express server on port ${PORT:-3001}..."
exec node server.js

