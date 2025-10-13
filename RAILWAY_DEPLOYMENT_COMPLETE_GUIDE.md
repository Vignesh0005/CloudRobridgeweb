# 🚂 Complete Railway Deployment Guide for Robridge Backend

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Strategy](#database-strategy)
4. [Deployment Methods](#deployment-methods)
5. [Step-by-Step Setup](#step-by-step-setup)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)
8. [ESP32 Configuration](#esp32-configuration)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Your Robridge backend consists of **3 services**:

| Service | File | Port | Purpose |
|---------|------|------|---------|
| **Express Server** | `Robridge web/server.js` | 3001 | Main API, WebSocket, Database |
| **AI Server** | `server.py` | 8000 | OpenAI analysis, barcode/QR processing |
| **Flask Server** | `Barcode generator&Scanner/start_server.py` | 5000 | Barcode generation |

Railway will auto-assign ports in production (via `PORT` env variable).

---

## 📌 Prerequisites

### 1. **Railway Account**
- Sign up at [railway.app](https://railway.app)
- Link your GitHub account

### 2. **GitHub Repository**
- Push your code to GitHub
- Make sure sensitive files (.env) are in `.gitignore`

### 3. **OpenAI API Key**
- Get from [platform.openai.com](https://platform.openai.com)
- You'll add this as an environment variable

---

## 🗄️ Database Strategy

### **Problem: SQLite Doesn't Work Well on Railway**
Railway's filesystem is ephemeral, meaning SQLite data is lost on redeploy.

### **Solution Options:**

#### **Option A: Railway PostgreSQL (Recommended)**
```bash
# Railway will provide DATABASE_URL automatically
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

**Changes Needed:**
- Update `server.js` to use PostgreSQL instead of SQLite
- Install `pg` package: `npm install pg`
- Migrate database schema

#### **Option B: External PostgreSQL**
Use free tier from:
- **Supabase** (2 free databases)
- **Neon** (1 free database)
- **ElephantSQL** (20MB free)

#### **Option C: Keep SQLite with Volume**
- Railway supports volumes (paid feature)
- Data persists across deploys
- Not recommended for production

---

## 🚀 Deployment Methods

### **Method 1: Three Separate Services (Recommended)**

**Pros:**
- ✅ Independent scaling
- ✅ Independent restarts
- ✅ Clear separation of concerns
- ✅ Better Railway logs

**Cons:**
- ❌ Three separate deployments
- ❌ Slightly more complex setup

### **Method 2: Monorepo (All in One)**

**Pros:**
- ✅ Single deployment
- ✅ Simpler to manage

**Cons:**
- ❌ All services restart together
- ❌ Can't scale independently
- ❌ Railway doesn't support multiple processes well

**Recommendation:** Use Method 1 (Three Services)

---

## 📝 Step-by-Step Setup

### **Step 1: Prepare Your Code**

#### 1.1 Create Modified Server Files

I've already created `server-railway.py` for you with environment variables. 

**For Express Server:** Create `Robridge web/server-railway.js`:

```javascript
// At the top of server.js, add:
const PORT = process.env.PORT || 3001;

// Replace hardcoded port 3001 with PORT variable:
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Main server running on port ${PORT}`);
});

// Replace hardcoded localhost references with environment variables:
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';
const FLASK_SERVER_URL = process.env.FLASK_SERVER_URL || 'http://localhost:5000';
```

#### 1.2 Update Database Connection

Replace SQLite with PostgreSQL in `server.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Replace db.all() calls with pool.query()
```

#### 1.3 Update Dependencies

**Add to `Robridge web/package.json`:**
```json
{
  "dependencies": {
    "pg": "^8.11.0"
  }
}
```

### **Step 2: Push to GitHub**

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

---

### **Step 3: Deploy Service 1 - Express Server**

#### 3.1 Create New Project in Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `Robridge-Web-Production` repository

#### 3.2 Configure Service
1. **Service Name:** `robridge-express`
2. **Root Directory:** `Robridge web`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `node server.js`

#### 3.3 Add Environment Variables
```bash
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
AI_SERVER_URL=https://robridge-ai-production.up.railway.app
FLASK_SERVER_URL=https://robridge-flask-production.up.railway.app
CORS_ORIGIN=*
```

#### 3.4 Add PostgreSQL Database
1. Click "New" → "Database" → "PostgreSQL"
2. Railway automatically sets `DATABASE_URL`
3. Run database migrations (create tables)

---

### **Step 4: Deploy Service 2 - AI Server**

#### 4.1 Create New Service
1. In same Railway project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose same repository

#### 4.2 Configure Service
1. **Service Name:** `robridge-ai`
2. **Root Directory:** `.` (root)
3. **Build Command:** Leave empty or `pip install -r requirements.txt`
4. **Start Command:** `python server-railway.py`

Or use the startup script:
```bash
chmod +x railway-ai-start.sh && ./railway-ai-start.sh
```

#### 4.3 Add Environment Variables
```bash
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
AI_SERVER_PORT=8000
AI_SERVER_HOST=0.0.0.0
NODE_ENV=production
ALLOWED_ORIGINS=*
```

---

### **Step 5: Deploy Service 3 - Flask Server**

#### 5.1 Create New Service
1. Click "New Service" again
2. Select same repository

#### 5.2 Configure Service
1. **Service Name:** `robridge-flask`
2. **Root Directory:** `Barcode generator&Scanner`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `python start_server.py`

Or use startup script:
```bash
chmod +x railway-flask-start.sh && ./railway-flask-start.sh
```

#### 5.3 Add Environment Variables
```bash
FLASK_PORT=5000
FLASK_HOST=0.0.0.0
NODE_ENV=production
```

---

### **Step 6: Link Services Together**

Update environment variables with Railway-provided URLs:

#### Express Server (`robridge-express`)
```bash
AI_SERVER_URL=https://robridge-ai-production.up.railway.app
FLASK_SERVER_URL=https://robridge-flask-production.up.railway.app
```

Railway provides URLs like:
```
robridge-express-production.up.railway.app
robridge-ai-production.up.railway.app
robridge-flask-production.up.railway.app
```

---

## 🔐 Environment Variables Reference

### **robridge-express** (Express Server)
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<auto-provided-by-railway>
FRONTEND_URL=https://your-frontend.vercel.app
AI_SERVER_URL=https://robridge-ai-production.up.railway.app
FLASK_SERVER_URL=https://robridge-flask-production.up.railway.app
CORS_ORIGIN=*
```

### **robridge-ai** (AI Server)
```bash
OPENAI_API_KEY=sk-proj-your-actual-key
AI_SERVER_PORT=8000
AI_SERVER_HOST=0.0.0.0
NODE_ENV=production
ALLOWED_ORIGINS=*
UPC_ITEM_DB_API_KEY=<optional>
BARCODE_LOOKUP_API_KEY=<optional>
```

### **robridge-flask** (Flask Server)
```bash
FLASK_PORT=5000
FLASK_HOST=0.0.0.0
NODE_ENV=production
```

---

## 🧪 Testing Your Deployment

### Test Each Service:

#### 1. Express Server
```bash
curl https://robridge-express-production.up.railway.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

#### 2. AI Server
```bash
curl https://robridge-ai-production.up.railway.app/health
# Expected: {"status":"ok","service":"Robridge AI Scanner"}
```

#### 3. Flask Server
```bash
curl https://robridge-flask-production.up.railway.app/health
# Expected: Health check response
```

### Test ESP32 Integration
```bash
curl -X POST "https://robridge-ai-production.up.railway.app/api/esp32/scan" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test123",
    "barcodeData": "8901180948385",
    "deviceName": "Test Device"
  }'
```

---

## 📱 ESP32 Configuration

Update your ESP32 Arduino code:

```cpp
// Replace local IP with Railway URLs
const char* serverIP = "robridge-express-production.up.railway.app";
const int serverPort = 443;  // HTTPS port
const char* aiServerURL = "https://robridge-ai-production.up.railway.app";

// Use HTTPS instead of HTTP
WiFiClientSecure client;
client.setInsecure(); // For testing only, use proper SSL in production
```

---

## 🐛 Troubleshooting

### **Service Won't Start**
```bash
# Check Railway logs:
# Dashboard → Service → Deployments → View Logs
```

**Common Issues:**
- Missing environment variables
- Port conflicts (use `PORT` env variable)
- Missing dependencies
- Build command errors

### **Database Connection Errors**
```bash
# Check DATABASE_URL is set:
# Railway Dashboard → Service → Variables
```

**Solutions:**
- Ensure PostgreSQL is added
- Check connection string format
- Verify SSL settings

### **CORS Errors**
```bash
# Add frontend URL to CORS_ORIGIN:
CORS_ORIGIN=https://your-frontend.vercel.app
```

### **AI Server Timeout**
```bash
# Increase timeout in Express server:
fetch(aiUrl, {
  signal: AbortSignal.timeout(30000) // 30 seconds
})
```

---

## 📊 Cost Estimation

**Railway Free Tier:**
- $5 free credit/month
- Good for development and testing

**Recommended Plan for Production:**
- **Hobby Plan**: $5/month per service
- **3 Services** = $15/month
- **PostgreSQL**: Included in project

**Total:** ~$15-20/month for full backend

---

## 🎯 Next Steps

1. ✅ Deploy all 3 services
2. ✅ Add environment variables
3. ✅ Test all endpoints
4. ✅ Update ESP32 firmware with Railway URLs
5. ✅ Deploy frontend to Vercel/Netlify
6. ✅ Update CORS settings
7. ✅ Monitor logs and performance
8. ✅ Set up custom domain (optional)

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)
- [Environment Variables](https://docs.railway.app/develop/variables)

---

## ✅ Deployment Checklist

- [ ] Create Railway account
- [ ] Push code to GitHub
- [ ] Deploy Express server
- [ ] Deploy AI server
- [ ] Deploy Flask server
- [ ] Add PostgreSQL database
- [ ] Set all environment variables
- [ ] Link services together
- [ ] Test all endpoints
- [ ] Update ESP32 firmware
- [ ] Update frontend API URLs
- [ ] Configure CORS
- [ ] Monitor logs
- [ ] Set up custom domain (optional)

---

**You're ready to deploy to Railway! 🚀**

For questions, check Railway's documentation or Discord community.

