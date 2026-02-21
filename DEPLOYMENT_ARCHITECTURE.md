# Deployment Architecture

## Before Deployment (Current)

```
┌─────────────────────┐
│  Your Local Machine │
├─────────────────────┤
│  Frontend             │
│  React + Vite        │
│  localhost:5173      │
├─────────────────────┤
│  Backend             │
│  Flask               │
│  localhost:5000      │
├─────────────────────┤
│  Gmail Credentials   │
│  client_secret.json  │
│  (⚠️ Local only)     │
└─────────────────────┘
```

**Problem**: Can't push to GitHub because of credentials

---

## After Deployment (What We're Building)

```
                      ┌─────────────────────────────────────┐
                      │     Google Cloud Console            │
                      │  - OAuth Configuration              │
                      │  - client_secret.json (Safe)        │
                      └────────────┬────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
         ┌──────────▼────────┐    │    ┌─────────▼──────────┐
         │  Vercel Frontend  │    │    │  Railway Backend   │
         ├───────────────────┤    │    ├────────────────────┤
         │ React + Vite      │    │    │ Flask              │
         │ npm run build     │    │    │ Gunicorn           │
         │                   │    │    │                    │
         │ https://app.      │    │    │ https://backend.   │
         │ vercel.app        │    │    │ railway.app        │
         │                   │    │    │                    │
         │ VITE_API_URL=     │    │    │ FRONTEND_URL=      │
         │ backend.railway   │    │    │ app.vercel.app     │
         │ .app              │    │    │                    │
         │                   │    │    │ Credentials stored │
         │ (No credentials)  │    │    │ as env variables   │
         └───────────┬───────┘    │    └────────┬───────────┘
                     │            │            │
                     │ OAuth Flow │            │
                     └────────────┼────────────┘
                                  ▼
                          ┌───────────────┐
                          │  Gmail User   │
                          │  Authentication│
                          └───────────────┘
```

---

## Key Improvements

### 1. Security ✅
- **Before**: Credentials in GitHub (BAD)
- **After**: Credentials in Railway environment variables (SAFE)

### 2. Scalability ✅
- **Before**: Frontend and backend on same machine
- **After**: Separate machines, can scale independently

### 3. Always On ✅
- **Before**: Only available when local machine running
- **After**: Live 24/7 on the internet

### 4. Auto-Deploy ✅
- **Before**: Manual deployment
- **After**: Push to GitHub → auto deploys to Vercel & Railway

---

## Data Flow

### Local Development
```
Browser (localhost:5173)
    ↓
React App → Axios
    ↓
http://localhost:5000 (Backend)
    ↓
Flask Routes
    ↓
Gmail API
```

### Production
```
Browser (app.vercel.app)
    ↓
React App → Axios
    ↓
https://backend.railway.app (Backend)
    ↓
Flask Routes
    ↓
Gmail API (using Railway env credentials)
```

---

## OAuth Flow

### Step 1: User clicks "Connect with Gmail"
```
Frontend (vercel.app) 
  → Calls backend /auth/login
  → Backend redirects to Google OAuth
  → User logs in on Google
```

### Step 2: Google redirects to callback
```
Google
  → Redirects to https://backend.railway.app/auth/callback
  → Backend validates & saves credentials to session
```

### Step 3: Backend redirects to onboarding
```
Backend
  → Redirects to https://app.vercel.app/onboarding?auth=success
  → Frontend loads onboarding page
```

---

## Environment Variables Control Data Flow

### Frontend (`Vercel`):
```
VITE_API_URL=https://backend.railway.app
↑
Tells frontend where to send API requests
```

### Backend (`Railway`):
```
FRONTEND_URL=https://app.vercel.app
CORS_ORIGINS=https://app.vercel.app,...
↑
Tells backend where to redirect after OAuth
Tells backend what frontend domains are allowed
```

### Both:
```
CORS_ORIGINS, FRONTEND_URL, etc.
↑
Must match for OAuth flow to work
```

---

## Deployment Timeline

```
Day 1:
├─ Friday Deploy to Railway (backend)
├─ Friday Deploy to Vercel (frontend)
├─ Friday Update Gmail OAuth settings
└─ Friday Test everything

After deployment:
├─ Auto-deploy when you push to GitHub
├─ Auto-deploy when you update env variables
└─ Live for anyone with the URL
```

---

## Cost Reference

### Free Tier (Should be fine for your app):

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel | 100GB bandwidth/month | Free |
| Railway | $5/month credit | Free for first month |
| Google Cloud | 2,500 queries/day | Free tier generous |

Total: **Free or very cheap** while learning

---

## What Goes Where

### You Keep on Your Machine
```
.env (local development)
.env.local (frontend local dev)
client_secret.json (local development only)
```

### GitHub Gets
```
Source code (*.py, *.jsx, etc.)
Configuration (vite.config.js, package.json, etc.)
NOT: .env files or client_secret.json
```

### Railway Gets (from GitHub)
```
Backend code
requirements.txt
Dependencies install
THEN: Environment variables injected
THEN: App starts with app.py
```

### Vercel Gets (from GitHub)
```
Frontend code (frontend/ directory)
package.json
Dependencies install (npm install)
Build step (npm run build)
THEN: Environment variables injected
THEN: dist/ folder served to web
```

---

## Why This Works

```
┌─ Credentials Safe ────────────────┐
│  - Not in GitHub                  │
│  - Not in frontend                │
│  - Only on Railway                │
│  - Accessed via environment vars  │
└───────────────────────────────────┘

┌─ Frontend & Backend Separated ────┐
│  - Different domains              │
│  - Different servers              │
│  - Can scale independently        │
│  - CORS properly configured       │
└───────────────────────────────────┘

┌─ OAuth Works ─────────────────────┐
│  - Frontend: vercel.app           │
│  - Backend: railway.app           │
│  - Google knows about both        │
│  - Redirects work correctly       │
└───────────────────────────────────┘

┌─ Auto-Deploy ─────────────────────┐
│  - Push to GitHub                 │
│  - Railway catches it             │
│  - Vercel catches it              │
│  - Both auto-build & deploy       │
│  - Live in 2-3 minutes            │
└───────────────────────────────────┘
```

---

## Next Steps

1. **Push clean repo to GitHub** (no .env or credentials)
2. **Deploy backend to Railway**
   - Get Railway URL
3. **Deploy frontend to Vercel**
   - Get Vercel URL
4. **Update Gmail OAuth**
   - Add both URLs to Google Console
5. **Connect the URLs**
   - Update Railway environment variables
   - Update Vercel environment variables
6. **Test**
   - Visit frontend URL
   - Test full OAuth flow
7. **Done!** 🎉
   - App is live
   - Auto-deploys on git push

---

## Commands You'll Need

### To generate a random secret:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### To test locally:
```bash
python app.py
cd frontend && npm run dev
```

### To push updates:
```bash
git add .
git commit -m "Your message"
git push origin main
```

Both services auto-deploy!

---

**Ready to deploy? Head to [DEPLOYMENT_FINAL_GUIDE.md](DEPLOYMENT_FINAL_GUIDE.md) for step-by-step instructions!**
