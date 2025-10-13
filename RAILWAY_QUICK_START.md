# 🚂 Railway Deployment - Quick Start Guide

## 🎯 What You Need to Deploy

### **3 Backend Services:**
1. **Express Server** - `Robridge web/server.js`
2. **AI Server** - `server.py` 
3. **Flask Server** - `Barcode generator&Scanner/start_server.py`

---

## ⚡ Quick Setup (5 Steps)

### **Step 1: Fix Critical Security Issue**

**⚠️ YOUR OPENAI API KEY IS EXPOSED IN server.py LINE 14**

Replace `server.py` with `server-railway.py` (already created for you):

```bash
# Backup original
mv server.py server-original.py

# Use Railway version
cp server-railway.py server.py
```

---

### **Step 2: Commit to GitHub**

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

---

### **Step 3: Deploy to Railway**

#### **Service 1: Express Server**
```
1. Go to railway.app → New Project → Deploy from GitHub
2. Select your repo
3. Service Name: robridge-express
4. Root Directory: Robridge web
5. Start Command: node server.js
6. Add PostgreSQL database
7. Add environment variables (see below)
```

#### **Service 2: AI Server**
```
1. Same project → New Service
2. Service Name: robridge-ai
3. Root Directory: . (root)
4. Start Command: python server-railway.py
5. Add environment variables (see below)
```

#### **Service 3: Flask Server**
```
1. Same project → New Service
2. Service Name: robridge-flask  
3. Root Directory: Barcode generator&Scanner
4. Start Command: python start_server.py
5. Add environment variables (see below)
```

---

### **Step 4: Add Environment Variables**

#### **robridge-express:**
```bash
NODE_ENV=production
DATABASE_URL=<auto-set-by-railway>
AI_SERVER_URL=https://robridge-ai-production.up.railway.app
FLASK_SERVER_URL=https://robridge-flask-production.up.railway.app
CORS_ORIGIN=*
```

#### **robridge-ai:**
```bash
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
AI_SERVER_HOST=0.0.0.0
NODE_ENV=production
ALLOWED_ORIGINS=*
```

#### **robridge-flask:**
```bash
FLASK_HOST=0.0.0.0
NODE_ENV=production
```

---

### **Step 5: Test Deployment**

```bash
# Test Express Server
curl https://robridge-express-production.up.railway.app/api/health

# Test AI Server  
curl https://robridge-ai-production.up.railway.app/health

# Test Flask Server
curl https://robridge-flask-production.up.railway.app/health
```

---

## 🔧 Required Code Changes

### **1. Express Server (server.js)**

Add at the top:
```javascript
const PORT = process.env.PORT || 3001;

// Replace all localhost references:
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';
const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || 'http://localhost:5000';

// Replace server.listen:
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **2. Database Migration (SQLite → PostgreSQL)**

**Install pg package:**
```bash
cd "Robridge web"
npm install pg
```

**Replace SQLite code:**
```javascript
// OLD (SQLite):
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

// NEW (PostgreSQL):
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Replace db.all() with pool.query()
// Replace db.run() with pool.query()
```

---

## 📱 ESP32 Configuration

Update ESP32 Arduino code with Railway URLs:

```cpp
// Replace these lines:
const char* serverIP = "robridge-express-production.up.railway.app";
const int serverPort = 443;  // HTTPS
const char* baseURL = "https://robridge-express-production.up.railway.app";

// For HTTPS, use WiFiClientSecure:
WiFiClientSecure client;
client.setInsecure(); // For testing
```

---

## 💰 Cost

**Railway Pricing:**
- Free: $5 credit/month
- Hobby: $5/service/month
- **Your cost:** ~$15/month (3 services)

---

## 🐛 Common Issues

### **"Port already in use"**
```javascript
// Use Railway's PORT variable:
const PORT = process.env.PORT || 3001;
```

### **"OPENAI_API_KEY not found"**
```bash
# Add in Railway dashboard:
# Service → Variables → New Variable
OPENAI_API_KEY=sk-proj-your-key-here
```

### **"Database connection failed"**
```bash
# Make sure PostgreSQL is added:
# Project → New → Database → PostgreSQL
```

### **"CORS Error"**
```bash
# Add frontend URL:
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## 📋 Files I Created for You

1. ✅ `server-railway.py` - AI server with env variables
2. ✅ `railway.json` - Railway configuration
3. ✅ `nixpacks.toml` - Build configuration
4. ✅ `Procfile` - Process definition
5. ✅ `env.example` - Environment variables template
6. ✅ `railway-express-start.sh` - Express startup script
7. ✅ `railway-ai-start.sh` - AI startup script
8. ✅ `railway-flask-start.sh` - Flask startup script

---

## ✅ Quick Checklist

- [ ] Replace `server.py` with `server-railway.py`
- [ ] Update `server.js` with PORT variable
- [ ] Migrate SQLite to PostgreSQL
- [ ] Push to GitHub
- [ ] Create 3 Railway services
- [ ] Add PostgreSQL database
- [ ] Add all environment variables
- [ ] Link services with URLs
- [ ] Test all endpoints
- [ ] Update ESP32 firmware

---

## 🚀 Ready to Deploy!

**Read full guide:** `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md`

**Questions?** Check Railway docs: https://docs.railway.app

---

**Estimated Setup Time:** 30-60 minutes

