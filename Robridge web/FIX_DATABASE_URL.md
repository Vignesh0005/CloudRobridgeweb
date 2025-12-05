# 🔧 Fix DATABASE_URL Environment Variable

## Problem
The server is trying to connect to `localhost:5432` instead of your Render.com database because `DATABASE_URL` is not set.

## Solution: Add DATABASE_URL to Render.com

### Step-by-Step Instructions:

1. **Go to Render.com Dashboard**
   - Navigate to: https://dashboard.render.com
   - Click on your `robridge-express` service

2. **Open Environment Tab**
   - Click on **"Environment"** in the left sidebar
   - Or go to: Settings → Environment

3. **Add DATABASE_URL**
   - Click **"Add Environment Variable"** or **"Add"** button
   - **Key**: `DATABASE_URL`
   - **Value**: 
     ```
     postgresql://robridgedb_user:8NcVhAHtrzMemZsRjcOVxztpxoxySsi5@dpg-d4kn2nk9c44c73f2hhdg-a.oregon-postgres.render.com/robridgedb
     ```
   - Click **"Save Changes"**

4. **Verify Other Variables**
   Make sure these are also set:
   - `NODE_ENV` = `production`
   - `AI_SERVER_URL` = `https://robridgeaiserver.onrender.com`
   - `JWT_SECRET` (optional but recommended)

5. **Redeploy**
   - After saving, Render.com will automatically redeploy
   - Or click **"Manual Deploy"** → **"Deploy latest commit"**
   - Wait 2-3 minutes for deployment

## Expected Result

After adding `DATABASE_URL`, the logs should show:
```
🔍 Database connection details:
   DATABASE_URL: Set
   NODE_ENV: production
Connected to PostgreSQL database
✅ Users table created/verified
✅ Default users created
```

## Test After Deployment

Once deployment completes, test with:
```powershell
$body = @{email="admin@robridge.com"; password="admin123"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://robridgeexpress.onrender.com/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

You should get a successful login response with a token!

---

**The DATABASE_URL is the External Database URL from your PostgreSQL service in Render.com.**

