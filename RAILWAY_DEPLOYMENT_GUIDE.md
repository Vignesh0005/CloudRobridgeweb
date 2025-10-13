# 🚂 Railway Deployment Guide for Robridge Backend

## 📋 Overview

Your Robridge backend consists of **3 separate services** that need to run simultaneously:

1. **Node.js Express Server** (`server.js`) - Port 3001
2. **Python AI Server** (`server.py`) - Port 8000
3. **Python Flask Backend** (`start_server.py`) - Port 5000

Railway supports deploying these as **separate services** or as a **monorepo with multiple services**.

---

## 🎯 Deployment Strategy

### **Option 1: Multiple Services (Recommended)**
Deploy each backend as a separate Railway service. This is the most scalable approach.

### **Option 2: Monorepo with Procfile**
Deploy all services from one repository using a Procfile to manage multiple processes.

---

## 📁 Required Configuration Files

### **1. Create Root-Level Files**

I'll create all necessary configuration files for you.

---

## 🔧 Step-by-Step Railway Setup

### **Step 1: Prepare Your Code**

First, we need to:
1. ✅ Move sensitive data to environment variables
2. ✅ Create configuration files
3. ✅ Update database strategy (SQLite → PostgreSQL recommended)
4. ✅ Configure ports for Railway

### **Step 2: Remove Hardcoded Secrets**

⚠️ **CRITICAL**: Your OpenAI API key is hardcoded in `server.py` line 14. We MUST move this to environment variables.

### **Step 3: Database Migration**

⚠️ **SQLite Issue**: Railway's ephemeral filesystem means SQLite data will be lost on redeploy. 

**Solutions:**
- **Option A**: Use Railway's PostgreSQL plugin (recommended)
- **Option B**: Use external database service (Supabase, PlanetScale)
- **Option C**: Keep SQLite with volume mounting (limited)

### **Step 4: Create Railway Services**

You'll create 3 Railway services:
1. **robridge-express** - Node.js server
2. **robridge-ai** - Python AI server  
3. **robridge-flask** - Python barcode server

---

## 📝 Configuration Files to Create

Let me create all the necessary files for you:


