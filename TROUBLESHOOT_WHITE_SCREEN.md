# Troubleshooting: White Screen on Vercel Frontend

## What's Happening

You're seeing a blank white screen at `https://your-app.vercel.app`

This usually means:
- Frontend deployed successfully ✅
- But frontend can't connect to backend ❌
- Frontend is waiting for data but times out

---

## Step 1: Check Browser Console for Errors

**Critical - Do this first:**

1. Visit: `https://your-app.vercel.app`
2. Right-click → "Inspect" or press `F12`
3. Go to "Console" tab
4. Look for red errors

**Common errors you might see:**

### Error 1: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**This means:** Backend won't accept requests from your Vercel domain

**Fix:**
1. Go to Railway dashboard
2. Click Variables
3. Check `CORS_ORIGINS` includes your Vercel domain
4. Example: `https://bnpl-guardian.vercel.app`
5. Click Redeploy

### Error 2: Failed to Fetch
```
Failed to fetch from https://your-backend.railway.app/...
TypeError: fetch failed
```
**This means:** Frontend can't reach the backend

**Fix:**
1. Go to Vercel dashboard
2. Click Settings → Environment Variables
3. Check `VITE_API_URL` is set correctly
4. Copy it from Railway domain exactly
5. Example: `https://web-production-xxx.railway.app`
6. Redeploy Vercel

### Error 3: API Returns 404
```
404 Not Found /api/health
```
**This means:** Your backend isn't running properly

**Fix:**
1. Go to Railway dashboard
2. Click Deployments
3. Check if latest deployment has a green checkmark ✅
4. If red ❌, click it to view logs
5. Check for errors in the logs

---

## Step 2: Check Vercel Deployment Status

1. Go to: https://vercel.com
2. Click your BNPL project
3. Go to "Deployments" tab
4. Look for the latest deployment

### What to look for:

**If green checkmark ✅:**
```
Ready
Production
```
Deploy succeeded! Move to Step 3.

**If red X ❌ or yellow clock:**
```
Failed / Building
```
- Click it to view logs
- Look for error messages
- Common issues:
  - Missing environment variables
  - npm build failed
  - Vite config error

---

## Step 3: Check Railway Status

1. Go to: https://railway.app
2. Click your project
3. Go to "Deployments" tab
4. Look for latest deployment

### What to look for:

**If green checkmark ✅:**
```
Healthy
```
Backend is running! Move to Step 4.

**If red ❌:**
```
Crashed / Failed
```
- Click it to view logs
- Our previous fix should have worked
- If still failing, common issues:
  - Missing environment variables
  - Python import error
  - Database connection issue

---

## Step 4: Test Backend is Actually Running

Go to this URL in your browser:

```
https://your-backend.railway.app/api/health
```

Replace `your-backend` with your actual Railway domain.

### What you should see:

**Success:**
```json
{"status":"ok"}
```
This means backend is working!

**If you see:**
- **404 Page not found** → Backend isn't running
- **Can't reach** → Railway domain is wrong
- **Error message** → Backend has an error

---

## Step 5: Verify Environment Variables

### Check Vercel Variables:

1. Go to Vercel dashboard
2. Click your project → Settings
3. Go to Environment Variables
4. Verify you see:
   ```
   VITE_API_URL = https://your-backend.railway.app
   ```
5. If missing or wrong, update it
6. Redeploy Vercel

### Check Railway Variables:

1. Go to Railway dashboard
2. Click your project
3. Go to Variables
4. Verify you see:
   ```
   FRONTEND_URL = https://your-app.vercel.app
   CORS_ORIGINS = https://your-app.vercel.app,http://localhost:5173
   ```
5. If missing or wrong, update it
6. Redeploy Railway

**Important:** After changing variables:
- **Vercel**: Auto-redeploys (wait 1-2 minutes)
- **Railway**: Must click "..." → Redeploy manually

---

## Step 6: Check Your Frontend Code

Open `frontend/src/api/axios.js`:

Should look like:
```javascript
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }
  return window.location.origin
}
```

This code:
1. ✅ Uses `VITE_API_URL` if set (production)
2. ✅ Falls back to localhost (development)
3. ✅ Falls back to same domain (self-hosted)

---

## Step 7: Full Diagnostic Checklist

Go through this checklist:

- [ ] Vercel shows green checkmark ✅
- [ ] Railway shows green checkmark ✅
- [ ] `https://your-backend.railway.app/api/health` returns `{"status":"ok"}`
- [ ] Vercel has `VITE_API_URL` env var set
- [ ] Railway has `FRONTEND_URL` env var set
- [ ] Railway has `CORS_ORIGINS` includes your Vercel URL
- [ ] Browser console shows no red errors
- [ ] Frontend page eventually loads (not stuck)

---

## Common Scenarios & Fixes

### Scenario 1: Blank Page, Console Shows CORS Error

**Problem:** Frontend deployed, but backend blocked the request

**Fix:**
```
1. Railway dashboard → Variables
2. Set CORS_ORIGINS = https://your-vercel-domain.vercel.app
3. Click Redeploy
4. Wait 2 minutes
5. Refresh Vercel page
```

### Scenario 2: Blank Page, Console Shows 404

**Problem:** Frontend can't find the backend API

**Fix:**
```
1. Vercel dashboard → Settings → Environment Variables
2. Check VITE_API_URL is correct
3. Example: https://web-production-abc123.railway.app
4. Redeploy (auto-redeploys)
5. Refresh page
```

### Scenario 3: Blank Page, Nothing in Console

**Problem:** Frontend is stuck loading

**Fix:**
```
1. Press F12 → Network tab
2. Refresh page
3. Look for failed requests
4. Check which one failed
5. If /api/health fails → backend down
6. If /auth/status fails → check backend logs
```

### Scenario 4: "502 Bad Gateway" Error

**Problem:** Railway backend crashed

**Fix:**
```
1. Railway dashboard → Deployments
2. Click latest deployment
3. View logs
4. Look for error messages
5. Common: Missing environment variable
6. Add missing variable
7. Click Redeploy
```

---

## Quick Check: Is Backend Actually Running?

Run this command in your browser console:

```javascript
fetch('https://your-backend.railway.app/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend OK:', d))
  .catch(e => console.log('Backend DOWN:', e.message))
```

You should see:
```
Backend OK: {status: "ok"}
```

If you see:
```
Backend DOWN: fetch failed
```
= Backend not running or URL wrong

---

## Step-by-Step Fix for White Screen

**Follow these in order:**

1. **Check Vercel deployment status**
   - If red: Fix build errors in Vercel logs
   - If green: Continue

2. **Check Railway deployment status**
   - If red: Fix errors in Railway logs
   - If green: Continue

3. **Test backend URL**
   - Visit: `https://your-backend.railway.app/api/health`
   - If works: Continue
   - If fails: Redeploy Railway

4. **Check Vercel env vars**
   - Go to Vercel → Settings → Environment Variables
   - Look for `VITE_API_URL`
   - If missing: Add it
   - If wrong: Fix it
   - Vercel auto-redeploys

5. **Check Railway env vars**
   - Go to Railway → Variables
   - Look for `CORS_ORIGINS`
   - Should include your Vercel URL
   - If wrong: Fix it
   - Railway manual redeploy

6. **Refresh frontend**
   - Wait 2 minutes
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Should load now!

---

## If Still Stuck

Send me:

1. **Screenshot of browser console** (F12 → Console)
2. **Your Vercel URL** (e.g., bnpl-guardian.vercel.app)
3. **Your Railway URL** (e.g., web-production-xxx.railway.app)
4. **What you see** (blank, error message, etc.)

I can help debug from there!

---

## Prevention: Always Test Locally First

Before deploying to production:

```bash
# Terminal 1
python app.py

# Terminal 2
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

If it works locally, it should work in production (same code!)

If it doesn't work locally, fix it first before deploying.

---

**Try these steps and let me know what error you see in the browser console!**
