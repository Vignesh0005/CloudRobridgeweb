#!/bin/bash

# AI-Powered Barcode Scanner Demo Script

echo "🧪 Starting AI-Powered Barcode Scanner Demo..."

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

# Run the demo
echo "🎯 Running demo with sample barcodes..."
python3 demo.py
