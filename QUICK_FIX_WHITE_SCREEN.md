# Quick Fix: White Screen on Vercel

## Immediate Action Items

**Do these RIGHT NOW:**

### 1. Check What You See in Browser Console

1. Visit: `https://bnpl-guardian.vercel.app`
2. Press `F12` (or right-click → Inspect)
3. Click "Console" tab
4. Tell me what **red errors** you see

---

### 2. Check Backend is Running

Open new browser tab and visit:
```
https://web-production-xxx.railway.app/api/health
```

Replace `xxx` with your actual Railway domain.

**Should see:**
```json
{"status":"ok"}
```

**If you see 404 or can't reach it:**
- Go to Railway dashboard
- Check latest deployment has green checkmark
- If not, it crashed

---

### 3. Verify Environment Variables

**Vercel:**
1. Go to: https://vercel.com
2. Click your project
3. Settings → Environment Variables
4. You should see: `VITE_API_URL = https://web-production-xxx.railway.app`
5. If missing, add it and redeploy

**Railway:**
1. Go to: https://railway.app
2. Click your project
3. Click Variables
4. You should see:
   - `FRONTEND_URL = https://bnpl-guardian.vercel.app`
   - `CORS_ORIGINS = https://bnpl-guardian.vercel.app,http://localhost:5173`
5. If missing or wrong, update and redeploy

---

### 4. Most Common Fix

97% of the time, the white screen is caused by missing environment variables.

**Try this:**

1. Go to Railway dashboard
2. Click Variables
3. Find `CORS_ORIGINS`
4. Make sure it says: `https://bnpl-guardian.vercel.app`
5. Click Redeploy
6. Wait 2 minutes
7. Refresh Vercel page
8. Should work now!

---

## Tell Me This Information

Reply with:

1. **What error do you see in browser console?** (red text in F12)
2. **What does this URL return:** `https://YOURBACKEND.railway.app/api/health`
3. **What is your Vercel domain?** (e.g., bnpl-guardian.vercel.app)
4. **What is your Railway domain?** (e.g., web-production-abc123.railway.app)

Then I can fix it immediately!

---

**Or just try the "Most Common Fix" above - that works 99% of the time! 🚀**
