#!/bin/bash
# Startup script for Railway - Flask Barcode Server

echo "🏷️  Starting Robridge Flask Barcode Server"
echo "=================================="

# Navigate to Barcode generator directory
cd "Barcode generator&Scanner" || exit 1

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

# Start the Flask server
echo "📊 Starting Flask server on port ${PORT:-5000}..."
exec python start_server.py

