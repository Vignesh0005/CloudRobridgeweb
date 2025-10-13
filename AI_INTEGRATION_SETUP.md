# Robridge AI Integration Setup Guide

## Overview
This guide sets up the complete data flow: **ESP32 → AI Server → ESP32 Display + Web Interface**

## System Architecture
```
ESP32 Scanner → server.py (AI Processing) → ESP32 Display
                    ↓
              Web Interface (Real-time updates)
```

## Prerequisites
- Python 3.8+
- Node.js 16+
- ESP32 with GM77 scanner
- OpenAI API key

## Setup Instructions

### 1. Install Python Dependencies
```bash
pip install fastapi uvicorn openai requests
```

### 2. Install Node.js Dependencies
```bash
cd "Robridge web"
npm install
```

### 3. Configure OpenAI API Key
Edit `server.py` and replace the API key:
```python
OPENAI_API_KEY = "your-actual-openai-api-key-here"
```

### 4. Update ESP32 Configuration
In `ESP32_GM77_WEBSITE_INTEGRATION.ino`, update:
```cpp
const char* serverIP = "YOUR_LAPTOP_IP";  // Your laptop's IP address
const int serverPort = 5000;  // AI server port
const int webPort = 3001;     // Web interface port
```

### 5. Start the System
```bash
python start_ai_system.py
```

## Data Flow

### 1. ESP32 Scans Barcode
- GM77 scanner reads barcode/QR code
- ESP32 displays "Scanned Data" on OLED
- ESP32 sends data to AI server

### 2. AI Processing
- `server.py` receives scan data
- OpenAI analyzes the barcode/QR code
- Returns structured JSON with:
  - Title
  - Category
  - Description
  - Country (for barcodes)

### 3. ESP32 Display
- ESP32 receives AI analysis
- Displays results on OLED:
  - AI Analysis screen
  - Product title and category
  - Country information
  - Detailed description

### 4. Web Interface
- Real-time updates via WebSocket
- Shows scan history
- Displays AI analysis results
- Device status monitoring

## API Endpoints

### AI Server (Port 5000)
- `POST /api/esp32/scan` - Process ESP32 scans with AI
- `GET /health` - Health check
- `POST /scan` - Web interface compatibility

### Web Interface (Port 3001)
- `POST /api/esp32/scan/:deviceId` - Receive ESP32 scans
- `GET /api/esp32/devices` - List connected devices
- `GET /api/barcodes/scanned` - Get scan history

## Testing the System

### 1. Test AI Server
```bash
curl -X POST "http://localhost:5000/api/esp32/scan" \
  -H "Content-Type: application/json" \
  -d '{
    "barcodeData": "1234567890123",
    "deviceId": "test",
    "deviceName": "Test Device"
  }'
```

### 2. Test Web Interface
```bash
curl -X GET "http://localhost:3001/api/health"
```

### 3. Test ESP32 Integration
1. Upload updated Arduino code to ESP32
2. Connect to WiFi
3. Scan a barcode
4. Check OLED display for AI analysis
5. Check web interface for real-time updates

## Troubleshooting

### Common Issues

1. **ESP32 can't connect to server**
   - Check IP address in Arduino code
   - Ensure both servers are running
   - Check firewall settings

2. **AI analysis fails**
   - Verify OpenAI API key
   - Check internet connection
   - Review server logs

3. **Web interface not updating**
   - Check WebSocket connection
   - Verify port 3001 is accessible
   - Check browser console for errors

### Logs
- AI Server: Check console output
- Web Interface: Check Node.js logs
- ESP32: Monitor Serial output

## Features

### ESP32 Features
- ✅ Real-time barcode scanning
- ✅ AI-powered product analysis
- ✅ OLED display with results
- ✅ WiFi connectivity
- ✅ Error handling and retry logic

### AI Server Features
- ✅ OpenAI GPT integration
- ✅ Barcode country detection
- ✅ QR code analysis
- ✅ JSON response format
- ✅ Error handling and fallbacks

### Web Interface Features
- ✅ Real-time scan updates
- ✅ Device management
- ✅ Scan history
- ✅ AI analysis display
- ✅ WebSocket integration

## Security Notes
- ⚠️ OpenAI API key is currently hardcoded - move to environment variables
- ⚠️ CORS is enabled for all origins - restrict in production
- ⚠️ No authentication implemented - add for production use

## Next Steps
1. Move API keys to environment variables
2. Add authentication
3. Implement rate limiting
4. Add database persistence
5. Create mobile app integration

