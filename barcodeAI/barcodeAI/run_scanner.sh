#!/bin/bash

# AI-Powered Barcode Scanner Startup Script

echo "🚀 Starting AI-Powered Barcode Scanner..."

# Navigate to project directory
cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Please run setup first."
    exit 1
fi

# Set API key
export GEMINI_API_KEY="AIzaSyCCFrqS-5WoAvRoTmQb_qPDEsqlwSKZdm0"

# Run the scanner
echo "🎥 Starting barcode scanner..."
python3 barcode_scanner.py
