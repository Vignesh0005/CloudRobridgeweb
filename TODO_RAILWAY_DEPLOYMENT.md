# ✅ Railway Deployment - TODO Checklist

## 🔴 CRITICAL - Do First

- [ ] **SECURITY: Move OpenAI API Key to Environment Variable**
  - [ ] Replace `server.py` with `server-railway.py`
  - [ ] Add `OPENAI_API_KEY` to Railway environment variables
  - [ ] Remove API key from code
  - [ ] Test API key is working

---

## 📝 Pre-Deployment Tasks

### Code Changes

- [ ] **Update Express Server (server.js)**
  - [ ] Add `const PORT = process.env.PORT || 3001;`
  - [ ] Replace `server.listen(3001)` with `server.listen(PORT, '0.0.0.0')`
  - [ ] Add AI_SERVER_URL environment variable support
  - [ ] Add FLASK_SERVER_URL environment variable support
  - [ ] Test locally with PORT env variable

- [ ] **Database Migration (SQLite → PostgreSQL)**
  - [ ] Install pg package: `npm install pg`
  - [ ] Replace SQLite code with PostgreSQL
  - [ ] Create database schema SQL script
  - [ ] Test local PostgreSQL connection
  - [ ] Export existing SQLite data (if needed)

- [ ] **Update Python Dependencies**
  - [ ] Verify `requirements.txt` is complete
  - [ ] Test all Python dependencies install correctly
  - [ ] Check for version conflicts

### Repository Preparation

- [ ] **Git Repository**
  - [ ] Verify `.gitignore` includes `.env`
  - [ ] Remove any committed `.env` files
  - [ ] Commit all changes
  - [ ] Push to GitHub

- [ ] **Documentation**
  - [ ] Read `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md`
  - [ ] Read `RAILWAY_QUICK_START.md`
  - [ ] Prepare list of environment variables

---

## 🚂 Railway Setup

### Account & Project

- [ ] **Railway Account**
  - [ ] Sign up at railway.app
  - [ ] Connect GitHub account
  - [ ] Verify email address

- [ ] **Create Project**
  - [ ] Click "New Project"
  - [ ] Select "Deploy from GitHub repo"
  - [ ] Choose Robridge-Web-Production repository

---

### Service 1: Express Server

- [ ] **Create Service**
  - [ ] Service name: `robridge-express`
  - [ ] Root directory: `Robridge web`
  - [ ] Start command: `node server.js`

- [ ] **Add PostgreSQL Database**
  - [ ] Click "New" → "Database" → "PostgreSQL"
  - [ ] Verify `DATABASE_URL` is auto-set

- [ ] **Environment Variables**
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL=<auto-set>`
  - [ ] `AI_SERVER_URL=<will-add-after-ai-deploy>`
  - [ ] `FLASK_SERVER_URL=<will-add-after-flask-deploy>`
  - [ ] `CORS_ORIGIN=*`

- [ ] **Deploy & Test**
  - [ ] Click "Deploy"
  - [ ] Wait for build to complete
  - [ ] Check logs for errors
  - [ ] Copy Railway URL
  - [ ] Test: `curl https://your-url.railway.app/api/health`

---

### Service 2: AI Server

- [ ] **Create Service**
  - [ ] Click "New Service"
  - [ ] Same repository
  - [ ] Service name: `robridge-ai`
  - [ ] Root directory: `.` (root)
  - [ ] Start command: `python server-railway.py`

- [ ] **Environment Variables**
  - [ ] `OPENAI_API_KEY=sk-proj-your-key`
  - [ ] `AI_SERVER_HOST=0.0.0.0`
  - [ ] `NODE_ENV=production`
  - [ ] `ALLOWED_ORIGINS=*`

- [ ] **Deploy & Test**
  - [ ] Click "Deploy"
  - [ ] Check logs
  - [ ] Copy Railway URL
  - [ ] Test: `curl https://your-ai-url.railway.app/health`

---

### Service 3: Flask Server

- [ ] **Create Service**
  - [ ] Click "New Service"
  - [ ] Service name: `robridge-flask`
  - [ ] Root directory: `Barcode generator&Scanner`
  - [ ] Start command: `python start_server.py`

- [ ] **Environment Variables**
  - [ ] `FLASK_HOST=0.0.0.0`
  - [ ] `NODE_ENV=production`

- [ ] **Deploy & Test**
  - [ ] Click "Deploy"
  - [ ] Check logs
  - [ ] Copy Railway URL
  - [ ] Test: `curl https://your-flask-url.railway.app/health`

---

## 🔗 Link Services Together

- [ ] **Update Express Server**
  - [ ] Add AI_SERVER_URL with AI server Railway URL
  - [ ] Add FLASK_SERVER_URL with Flask server Railway URL
  - [ ] Redeploy Express server

- [ ] **Test Inter-Service Communication**
  - [ ] Test ESP32 scan endpoint
  - [ ] Test barcode generation
  - [ ] Check logs for connection errors

---

## 🗄️ Database Setup

- [ ] **PostgreSQL Schema**
  - [ ] Create `barcodes` table
  - [ ] Create `saved_scans` table
  - [ ] Create indexes
  - [ ] Test queries

- [ ] **Data Migration (if needed)**
  - [ ] Export SQLite data
  - [ ] Import to PostgreSQL
  - [ ] Verify data integrity

- [ ] **Test Database**
  - [ ] Test barcode save
  - [ ] Test barcode lookup
  - [ ] Test scan history

---

## 🧪 Testing

### Backend Tests

- [ ] **Express Server**
  - [ ] Health endpoint: `/api/health`
  - [ ] ESP32 registration: `/api/esp32/register`
  - [ ] ESP32 scan: `/api/esp32/scan/:deviceId`
  - [ ] WebSocket connection
  - [ ] Database queries

- [ ] **AI Server**
  - [ ] Health endpoint: `/health`
  - [ ] ESP32 scan: `/api/esp32/scan`
  - [ ] Barcode analysis
  - [ ] QR code analysis

- [ ] **Flask Server**
  - [ ] Health endpoint
  - [ ] Barcode generation
  - [ ] List barcodes

### Integration Tests

- [ ] **Full ESP32 Flow**
  - [ ] Device registration
  - [ ] Barcode scan
  - [ ] AI analysis
  - [ ] Database save
  - [ ] WebSocket broadcast

---

## 📱 ESP32 Configuration

- [ ] **Update Arduino Code**
  - [ ] Update server IP to Railway URL
  - [ ] Change to HTTPS (port 443)
  - [ ] Update AI server URL
  - [ ] Add WiFiClientSecure for HTTPS

- [ ] **Test ESP32**
  - [ ] Upload new firmware
  - [ ] Test WiFi connection
  - [ ] Test barcode scanning
  - [ ] Test AI analysis
  - [ ] Check serial monitor logs

---

## 🌐 Frontend Configuration

- [ ] **Update Frontend**
  - [ ] Update API URLs to Railway
  - [ ] Update WebSocket URL
  - [ ] Test all API calls
  - [ ] Deploy frontend (Vercel/Netlify)

- [ ] **Update CORS**
  - [ ] Add frontend URL to CORS_ORIGIN
  - [ ] Test cross-origin requests

---

## 📊 Monitoring & Optimization

- [ ] **Railway Dashboard**
  - [ ] Check CPU usage
  - [ ] Check memory usage
  - [ ] Review logs for errors
  - [ ] Set up log alerts (if available)

- [ ] **Performance**
  - [ ] Test API response times
  - [ ] Monitor database queries
  - [ ] Check WebSocket latency

---

## 🔐 Security

- [ ] **Environment Variables**
  - [ ] All secrets in Railway env vars
  - [ ] No hardcoded API keys
  - [ ] No committed .env files

- [ ] **CORS Configuration**
  - [ ] Restrict to specific origins (not *)
  - [ ] Test CORS policies

- [ ] **Database Security**
  - [ ] Use connection pooling
  - [ ] Parameterized queries
  - [ ] SSL connections

---

## 💰 Cost Management

- [ ] **Monitor Usage**
  - [ ] Check Railway credit usage
  - [ ] Review monthly costs
  - [ ] Optimize resource usage

- [ ] **Upgrade Plan (if needed)**
  - [ ] Hobby plan for production
  - [ ] Consider auto-scaling settings

---

## 📝 Documentation

- [ ] **Update README**
  - [ ] Add deployment instructions
  - [ ] Update API URLs
  - [ ] Add troubleshooting section

- [ ] **Create Runbook**
  - [ ] Deployment process
  - [ ] Rollback procedure
  - [ ] Common issues & solutions

---

## ✅ Final Checklist

- [ ] All 3 services deployed successfully
- [ ] All environment variables set correctly
- [ ] PostgreSQL database configured
- [ ] Services can communicate with each other
- [ ] ESP32 connects and scans successfully
- [ ] Frontend connects to backend
- [ ] Logs show no errors
- [ ] Performance is acceptable
- [ ] Security measures implemented
- [ ] Documentation updated

---

## 🎉 Post-Deployment

- [ ] **Monitor for 24 hours**
  - [ ] Check for errors
  - [ ] Monitor performance
  - [ ] Test all features

- [ ] **User Testing**
  - [ ] Test with real ESP32 devices
  - [ ] Test web interface
  - [ ] Verify data persistence

- [ ] **Optimization**
  - [ ] Review slow queries
  - [ ] Optimize API calls
  - [ ] Cache frequently accessed data

---

## 🆘 Emergency Contacts

- **Railway Support:** https://discord.gg/railway
- **Railway Docs:** https://docs.railway.app
- **Status Page:** https://status.railway.app

---

**Estimated Total Time:** 2-4 hours for initial deployment

**Start with:** 🔴 CRITICAL tasks, then work through each section in order.

**Good luck with your deployment! 🚀**

