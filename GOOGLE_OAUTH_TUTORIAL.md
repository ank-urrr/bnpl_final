# Google OAuth Configuration - Visual Step-by-Step Guide

## Overview

This tutorial shows you exactly how to update your Gmail OAuth settings in Google Cloud Console so your app can handle login redirects properly.

---

## What You're Doing

You're telling Google:
- ✅ "My frontend is hosted at https://vercel-domain.vercel.app"
- ✅ "My backend is at https://railway-domain.railway.app"
- ✅ "During local testing, I'm using localhost:5173 and localhost:5000"

This prevents the "Redirect URI mismatch" error on Gmail login.

---

## Prerequisites

Before you start, have these ready:

- Your **Vercel frontend URL**: `https://your-app.vercel.app` (from Vercel dashboard)
- Your **Railway backend URL**: `https://your-backend.railway.app` (from Railway dashboard)
- Google Cloud Console open: https://console.cloud.google.com

---

## Step 1: Open Google Cloud Console

Go to: https://console.cloud.google.com

You should see:
```
Google Cloud Console
├─ Select Project (dropdown at top)
├─ APIs & Services
└─ [Your Project Name] - BNPL Guardian (or similar)
```

---

## Step 2: Select Your Project

**If multiple projects exist:**

1. Click the **project dropdown** at the top left
2. Find and click your **BNPL project**
3. Wait for it to load

---

## Step 3: Go to APIs & Services

In the left sidebar, find **"APIs & Services"**

Click it to expand the menu:
```
APIs & Services
├─ Enabled APIs & services
├─ Library
├─ Credentials  ← Click here
└─ OAuth consent screen
```

---

## Step 4: Go to Credentials

In the left menu, click **"Credentials"**

You should see:
```
Credentials

Create Credentials dropdown
├─ OAuth 2.0 Client ID (your-project)
│  ├─ Name: Your App Name
│  ├─ Type: Web application
│  └─ [Click this one]
```

---

## Step 5: Click Your OAuth Client

Look for your **OAuth 2.0 Client ID** (should say "Web application")

Click on it to open the details.

You'll see:
```
OAuth 2.0 Client ID

Application type: Web application
Client ID: xxxxxxx.apps.googleusercontent.com
Client secret: xxxxx

Authorized JavaScript origins
(Currently: might be empty or have old URLs)

Authorized redirect URIs
(Coming next)
```

---

## Step 6: Add Authorized Redirect URIs

**Scroll down to "Authorized redirect URIs"** section.

This is where you tell Google where to send users AFTER they login with Gmail.

**You should add:**

1. **Your Railway backend callback:**
   ```
   https://your-backend.railway.app/auth/callback
   ```
   - Example: `https://web-production-abc123.railway.app/auth/callback`
   - This is where Flask receives the OAuth code from Google

2. **Local development backend:**
   ```
   http://localhost:5000/auth/callback
   ```
   - For testing on your machine

**Action:**
- Click **"+ ADD URI"** button
- Paste the first URI
- Click **"+ ADD URI"** again
- Paste the second URI

Result should look like:
```
✓ https://your-backend.railway.app/auth/callback
✓ http://localhost:5000/auth/callback
```

---

## Step 7: Add Authorized JavaScript Origins

**Scroll down further to "Authorized JavaScript origins"** section.

This tells Google what **frontend URLs** are allowed to make requests for Gmail authentication.

**You should add:**

1. **Your Vercel frontend:**
   ```
   https://your-app.vercel.app
   ```
   - Example: `https://bnpl-guardian.vercel.app`
   - No `/` at the end!

2. **Local development (Vite port):**
   ```
   http://localhost:5173
   ```
   - For `npm run dev`

3. **Local development (alternate port):**
   ```
   http://localhost:3000
   ```
   - Optional backup

**Action:**
- Click **"+ ADD URI"** button
- Paste: `https://your-app.vercel.app` (replace with your domain)
- Click **"+ ADD URI"** again
- Paste: `http://localhost:5173`
- Click **"+ ADD URI"** again (optional)
- Paste: `http://localhost:3000`

Result should look like:
```
✓ https://your-app.vercel.app
✓ http://localhost:5173
✓ http://localhost:3000
```

---

## Step 8: Verify All Settings

Before saving, double-check:

**Authorized redirect URIs:**
- [ ] `https://your-backend.railway.app/auth/callback`
- [ ] `http://localhost:5000/auth/callback`

**Authorized JavaScript origins:**
- [ ] `https://your-app.vercel.app` (no trailing slash!)
- [ ] `http://localhost:5173`
- [ ] `http://localhost:3000`

---

## Step 9: Save Changes

1. **Scroll to the bottom** of the form
2. **Click the blue "SAVE" button**
3. Wait for confirmation message

You should see:
```
✓ Successfully updated
```

---

## Step 10: Verify In Your App

After saving, test that it works:

### Test Locally First:

```bash
# Terminal 1
python app.py

# Terminal 2
cd frontend
npm run dev
```

Visit: http://localhost:5173
- Click "Connect with Gmail"
- You should be redirected to Gmail login
- After login, redirected back to localhost
- ✅ Should work!

### Test Production:

Visit your Vercel app: https://your-app.vercel.app
- Click "Connect with Gmail"
- Should redirected to Gmail
- After login, redirected back to Vercel
- ✅ Should work!

---

## Common Mistakes

### ❌ "Redirect URI mismatch" error

**Cause:** Your Railway/Vercel URL doesn't match what's in Google Cloud

**Fix:**
1. Copy exact URL from Railway dashboard
2. Add `/auth/callback` at the end
3. Make sure there's no typo
4. Click Save
5. Redeploy Railway

### ❌ Gmail login page shows error

**Cause:** Authorized JavaScript origins doesn't match frontend URL

**Fix:**
1. Copy exact URL from Vercel dashboard
2. Make sure NO trailing slash
3. Add to "Authorized JavaScript origins"
4. Click Save

### ❌ I added localhost but still doesn't work locally

**Cause:** Port number mismatch

**Fix:**
- If running on `http://localhost:5173` → add `http://localhost:5173`
- If running on `http://localhost:3000` → add `http://localhost:3000`
- Don't mix them up!

---

## Summary Table

| What | Where | Example |
|------|-------|---------|
| **Authorized redirect URIs** | Google's OAuth settings | `https://backend.railway.app/auth/callback` |
| **Authorized JavaScript origins** | Google's OAuth settings | `https://app.vercel.app` |
| **VITE_API_URL** | Vercel environment var | `https://backend.railway.app` |
| **FRONTEND_URL** | Railway environment var | `https://app.vercel.app` |

---

## What Happens When You Click "Connect with Gmail"

```
1. You click "Connect with Gmail" on Vercel frontend
   ↓
2. Frontend calls backend /auth/login route
   ↓
3. Backend redirects to Google OAuth page
   ← Google checks: Is this JavaScript origin allowed? 
   ← Yes? (checks "Authorized JavaScript origins") ✅
   ↓
4. You login on Google
   ↓
5. Google redirects to: https://backend.railway.app/auth/callback
   ← Google checks: Is this redirect URI allowed?
   ← Yes? (checks "Authorized redirect URIs") ✅
   ↓
6. Backend receives auth code, validates with Google
   ↓
7. Backend redirects you back to: https://app.vercel.app/onboarding
   ↓
8. You see the onboarding page ✅
```

If ANY URL doesn't match = Error! ❌

---

## Final Checklist

- [ ] Have Vercel URL ready
- [ ] Have Railway URL ready
- [ ] Went to Google Cloud Console
- [ ] Selected correct project
- [ ] Found OAuth 2.0 Client ID
- [ ] Added redirect URIs (2 of them)
- [ ] Added JavaScript origins (2-3 of them)
- [ ] Clicked SAVE
- [ ] Tested locally (worked ✓)
- [ ] Tested on production (worked ✓)

---

**You're done! Your OAuth is now configured! 🎉**

Test it by visiting your Vercel app and clicking "Connect with Gmail"
