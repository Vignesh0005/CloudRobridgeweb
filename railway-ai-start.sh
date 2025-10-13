#!/bin/bash
# Startup script for Railway - AI Server

echo "🤖 Starting Robridge AI Server"
echo "=================================="

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

# Start the AI server
echo "🧠 Starting AI server on port ${PORT:-8000}..."
exec python server.py

