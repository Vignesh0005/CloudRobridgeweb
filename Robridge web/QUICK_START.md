# 🚀 Quick Start Guide - RobBridge Rack Management

## The Problem
You're getting the error: `"Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"` because the frontend is trying to connect to the wrong port.

## ✅ Solution

### Step 1: Start the Python Backend
Open a terminal and run:
```bash
cd "Barcode generator&Scanner"
python start_server.py
```
You should see: `Barcode Generator Server Starting...` and `Server running on port 5000`

### Step 2: Start the Node.js Server
Open another terminal and run:
```bash
cd "Robridge web"
node server.js
```
You should see: `Server running on port 3001`

### Step 3: Open the Application
Go to: **http://localhost:3001** (NOT 3000!)

### Step 4: Initialize Database (First Time Only)
1. You should see "✅ Connected to backend" status
2. Click the "🗄️ Initialize Database" button
3. Wait for "Database initialized successfully!" message
4. The page will refresh and show the rack management interface

## 🔧 What I Fixed

1. **Corrected all API calls** to use `http://localhost:3001` instead of relative paths
2. **Added better error handling** to catch JSON parsing errors
3. **Added connection status indicator** in the UI
4. **Added database initialization** functionality
5. **Created startup scripts** for easy server management

## 🎯 Expected Result

- ✅ Connection status shows "Connected to backend"
- ✅ Database initialization button appears
- ✅ After clicking "Initialize Database", you see "Database initialized successfully!"
- ✅ Rack Management page loads without errors
- ✅ You can add, edit, delete, and search racks
- ✅ All data is saved to the SQLite database

## 🚨 If You Still See Errors

1. **Check the browser console** for detailed error messages
2. **Verify both servers are running**:
   - Python: http://localhost:5000/health
   - Node.js: http://localhost:3001/api/health
3. **Run the test script**: `node test-backend.js`

## 📱 Ports Used
- **Python Backend**: 5000
- **Node.js Server**: 3001
- **Frontend**: 3001 (served by Node.js)

The error you saw was because the frontend was trying to connect to port 3000, but your server runs on port 3001!
