# Hosting Guide: Separate Frontend & Backend

This guide walks through hosting your BNPL Guardian project with:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Flask)

## Why Separate Hosting?

1. **Security**: Keep Gmail API credentials on backend only (not in GitHub)
2. **Scalability**: Scale frontend and backend independently
3. **Cost**: Both services have generous free tiers
4. **Performance**: CDN for frontend, dedicated server for backend

---

## Part 1: Prepare Your Project

### 1.1 Create `.env` files (Never commit these to GitHub!)

Create [.env.local](.env.local) in the **frontend** folder:
```
# frontend/.env.local
VITE_API_URL=https://your-backend.railway.app
```

Update [.env](.env) in the **backend** folder:
```
SECRET_KEY="supersecret123-change-this"
FRONTEND_URL=https://your-frontend-vercel.app
CORS_ORIGINS=https://your-frontend-vercel.app,http://localhost:3000,http://localhost:5173
```

### 1.2 Create `.gitignore` entries

Make sure these are ignored globally:
```bash
# Already should be in .gitignore:
*.env
.env.local
client_secret.json
credentials.json
node_modules/
__pycache__/
dist/
```

### 1.3 Verify sensitive files are NOT in git

```bash
git status
# Should NOT show: client_secret.json or .env files
```

---

## Part 2: Backend Setup (Railway)

Railway is perfect for Flask apps. Free tier includes $5/month credit.

### 2.1 Prepare Backend for Production

Update [app.py](app.py) for production:
```python
# Around line 22-25, make sure these exist:
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Add this for production
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
```

### 2.2 Create `Procfile` (Already exists, verify it says):
```
web: python app.py
```

### 2.3 Create/Update `requirements.txt`

Run this locally to generate fresh requirements:
```bash
pip freeze > requirements.txt
```

Verify it includes:
- flask
- flask-cors
- google-auth-oauthlib
- google-auth-httplib2
- google-api-python-client
- python-dotenv

### 2.4 Sign up and Deploy to Railway

1. **Sign up**: https://railway.app (free with GitHub login)

2. **Create new project**:
   - Click "New Project" → "Deploy from GitHub"
   - Select your `bnplbackend` repository
   - Choose the main/master branch

3. **Connect GitHub**: 
   - Authorize Railway to access your repos
   - Select your BNPL project

4. **Configure environment in Railway**:
   - Go to your project → "Variables"
   - Add these environment variables:

   ```
   SECRET_KEY=<generate-a-random-secret>
   FRONTEND_URL=https://<your-frontend-vercel-domain>.vercel.app
   CORS_ORIGINS=https://<your-frontend-vercel-domain>.vercel.app,http://localhost:3000,http://localhost:5173
   GMAIL_CLIENT_SECRETS=<paste-your-client_secret.json-contents>
   ```

   **For GMAIL_CLIENT_SECRETS**: 
   - You need to paste your entire `client_secret.json` as an environment variable
   - Read the file and paste its full JSON content

5. **Update Gmail OAuth Redirect URI**:
   - Get your Railway domain: `https://your-backend-railway.app`
   - Go to Google Cloud Console → OAuth consent screen
   - Add authorized redirect URI: `https://your-backend-railway.app/auth/callback`

6. **Deploy**:
   - Railway auto-deploys on git push
   - Wait for build to complete (2-3 minutes)
   - Check logs if there are errors

---

## Part 3: Frontend Setup (Vercel)

Vercel is perfect for React/Vite apps. Free tier is unlimited.

### 3.1 Prepare Frontend

Make sure these files are ready:
- [frontend/package.json](frontend/package.json) ✓
- [frontend/vite.config.js](frontend/vite.config.js) ✓
- [frontend/.env.local]() (local only, not committed)

### 3.2 Update vite.config.js

Check it looks like this:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  plugins: [react()],
  publicDir: 'public',
})
```

For localhost dev: base should be `/`
(Only use `/bnpl_clean/` if deploying to GitHub Pages)

### 3.3 Sign up and Deploy to Vercel

1. **Sign up**: https://vercel.com (free with GitHub login)

2. **Import project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Select `frontend` folder as root directory

3. **Configure Build Settings**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `frontend`

4. **Environment Variables**:
   - Add: `VITE_API_URL=https://your-backend-railway.app`
   - This will be used in production builds

5. **Deploy**:
   - Vercel auto-deploys on git push to main
   - Build happens automatically
   - Your frontend will be live in 2-3 minutes

---

## Part 4: Connect Frontend & Backend

### 4.1 Update Frontend API Configuration

The frontend already handles this in [frontend/src/api/axios.js](frontend/src/api/axios.js):
```javascript
const getApiUrl = () => {
  // Priority 1: Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Priority 2: Development environment
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }
  
  // Priority 3: Same domain (for self-hosted deployments)
  return window.location.origin
}
```

This means:
- **Local dev**: Uses `localhost:5000`
- **Vercel production**: Uses `VITE_API_URL` env var

### 4.2 Update Backend for Frontend Origin

In [app.py](app.py), CORS is configured correctly:
```python
cors_origins = os.getenv("CORS_ORIGINS", "...").split(",")
CORS(app, supports_credentials=True, origins=cors_origins)
```

---

## Part 5: Gmail API Configuration

### 5.1 Update Authorized URLs in Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to "OAuth consent screen"
4. Add authorized JavaScript origins:
   - `https://your-frontend-vercel.app`
   - `http://localhost:3000`
   - `http://localhost:5173`

5. Add authorized redirect URIs:
   - `https://your-backend-railway.app/auth/callback`
   - `http://localhost:5000/auth/callback`

### 5.2 Store Credentials Securely

**NEVER commit `client_secret.json` to GitHub!**

Instead:
1. Keep it locally for development
2. Store as Railway environment variable (see Part 2, step 4)
3. Add to `.gitignore`:
   ```
   client_secret.json
   credentials.json
   ```

---

## Part 6: Testing the Full Flow

### 6.1 Local Testing

```bash
# Terminal 1: Backend
python app.py
# Should run on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Should run on http://localhost:5173
```

Visit: http://localhost:5173 → Click "Connect with Gmail" → Should work!

### 6.2 Production Testing

1. Visit your Vercel frontend: `https://your-app.vercel.app`
2. Click "Connect with Gmail"
3. Should redirect to your Railway backend
4. After Gmail auth, should redirect back to your Vercel app

---

## Part 7: Environment Variables Reference

### Railway (Backend) - Set in Railway Dashboard

```
SECRET_KEY=your-secret-key-here
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000,http://localhost:5173
GMAIL_CLIENT_SECRETS=<full-json-content>
```

### Vercel (Frontend) - Set in Vercel Dashboard

```
VITE_API_URL=https://your-backend.railway.app
```

### Local Development (.env files - NOT committed)

Backend `.env`:
```
SECRET_KEY=dev-secret
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Frontend `.env.local`:
```
VITE_API_URL=http://localhost:5000
```

---

## Part 8: Troubleshooting

### Issue: CORS Error
**Solution**: Check `CORS_ORIGINS` in Railway matches your Vercel domain

### Issue: Gmail Login Redirects Wrong Place
**Solution**: Check `FRONTEND_URL` in Railway matches your Vercel domain

### Issue: 404 on OAuth Callback
**Solution**: Add `https://your-backend.railway.app/auth/callback` to Google OAuth redirect URIs

### Issue: Backend Environmental Variables Not Loading
**Solution**: 
1. Restart Railway deployment after adding variables
2. Check variables in Railway dashboard → Project → Variables

### Issue: Frontend Can't Connect to Backend
**Solution**:
1. Check `VITE_API_URL` is set in Vercel
2. Check backend CORS allows your frontend URL
3. Check backend is actually running

---

## Part 9: Deployment Checklist

- [ ] Backend `.env` has `FRONTEND_URL=https://your-vercel-app.com`
- [ ] Frontend `.env.local` has `VITE_API_URL=https://your-railway-backend.app`
- [ ] `client_secret.json` NOT in `.gitignore` but IS ignored by git
- [ ] Railway has all environment variables set
- [ ] Vercel has `VITE_API_URL` set
- [ ] Google OAuth redirect URIs updated
- [ ] `Procfile` exists in backend root
- [ ] `requirements.txt` is up to date
- [ ] `package.json` scripts work locally

---

## Part 10: Useful Commands

```bash
# Check what's committed to git
git status

# See git history
git log --oneline

# Push to GitHub (auto-deploys to Railway & Vercel)
git push origin main

# Check Railway logs
# Visit railway.app dashboard → your project → Deployments → View logs

# Check Vercel logs
# Visit vercel.com dashboard → your project → Deployments → Logs
```

---

## Summary

Your architecture will be:

```
Frontend (Vercel)          Backend (Railway)         Gmail API
         ↓                        ↓                       ↓
https://app.vercel.app    https://backend.railway.app   Google Cloud Console
    (React/Vite)              (Flask)             client_secret.json (env var)
         ↓                        ↓                       ↑
         └─────────────────────────────────────────────────┘
              OAuth Flow with Secure Credentials
```

Let me know if you need help with any specific step!
