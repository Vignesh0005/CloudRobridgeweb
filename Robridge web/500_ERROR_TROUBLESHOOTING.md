# 🔧 500 Internal Server Error - Troubleshooting

## Current Status
- ✅ Endpoints are accessible (not 404)
- ❌ Getting 500 Internal Server Error
- This means code is deployed but there's a runtime error

## Common Causes & Solutions

### 1. Database Connection Issue
**Check Render.com logs for:**
```
Error connecting to database
DATABASE_URL not set
```

**Solution:**
- Verify `DATABASE_URL` environment variable is set correctly
- Check database is accessible
- Verify external connections are allowed

### 2. Missing Dependencies
**Check Render.com logs for:**
```
Cannot find module 'bcrypt'
Cannot find module 'jsonwebtoken'
```

**Solution:**
- Verify `package.json` has `bcrypt` and `jsonwebtoken`
- Check build logs show they were installed
- May need to clear cache and rebuild

### 3. Database Table Not Created
**Check Render.com logs for:**
```
relation "users" does not exist
```

**Solution:**
- Check if `initUsersTable()` is being called
- Verify database connection works
- Check for errors during table creation

### 4. JWT_SECRET Not Set
**Check Render.com logs for:**
```
JWT_SECRET is undefined
```

**Solution:**
- Add `JWT_SECRET` environment variable (optional, has default)
- Or verify default is being used

## How to Check Logs

1. Go to Render.com dashboard
2. Click on `robridge-express` service
3. Go to **"Logs"** tab
4. Look for error messages (usually in red)
5. Check the most recent errors

## What to Look For

### ✅ Good Signs:
```
✅ Users table created/verified
✅ Default users created
✅ Server started successfully
```

### ❌ Bad Signs:
```
❌ Error connecting to database
❌ Cannot find module 'bcrypt'
❌ relation "users" does not exist
❌ ReferenceError
❌ TypeError
```

## Quick Fixes

### If Database Connection Fails:
1. Verify `DATABASE_URL` in environment variables
2. Test database connection separately
3. Check database is running

### If Dependencies Missing:
1. Check `package.json` has dependencies
2. Clear build cache in Render.com
3. Trigger manual rebuild

### If Table Creation Fails:
1. Check database permissions
2. Verify connection string is correct
3. Check for SQL syntax errors

## Next Steps

1. **Check Render.com Logs** - This will show the exact error
2. **Share the error message** - I can help fix it
3. **Verify environment variables** - Make sure all are set
4. **Check database** - Ensure it's accessible

---

**The 500 error means the code is running, but something is failing at runtime. Check the logs to see what!**

