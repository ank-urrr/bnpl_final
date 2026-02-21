# Complete Production Deployment Guide

## Overview

Your BNPL Guardian project will be hosted as:
- **Frontend**: Vercel (https://your-app.vercel.app)
- **Backend**: Railway (https://your-backend.railway.app)

This solves the GitHub credentials issue because:
1. Credentials are stored as environment variables on Railway, not in GitHub
2. Frontend and backend are isolated on separate domains
3. Gmail OAuth works seamlessly between both

---

## Prerequisites

- GitHub account with your repo pushed
- Email for Vercel account (can use GitHub)
- Email for Railway account (can use GitHub)

---

## STEP-BY-STEP DEPLOYMENT

### STEP 1: Clean Up GitHub (5 minutes)

Before deploying, ensure no credentials are in your repo:

```bash
# Check git status
git status

# You should NOT see these files:
# - client_secret.json
# - .env
# - credentials.json

# If they are showing, remove them:
git rm --cached .env
git rm --cached client_secret.json
git commit -m "Remove sensitive files from tracking"
git push origin main
```

Verify [.gitignore](.gitignore) has:
```
*.env
.env.local
client_secret.json
credentials.json
__pycache__/
node_modules/
dist/
```

---

### STEP 2: Deploy Backend to Railway (10 minutes)

#### 2.1 Go to Railway.app

https://railway.app

#### 2.2 Sign Up with GitHub
- Click "Start New Project"
- Select "Deploy from GitHub repo"
- Authorize Railway

#### 2.3 Select Your Repository
- Choose `bnplbackend` repo
- Select `main` branch (or `master`)
- Click "Deploy"

#### 2.4 Wait for Initial Deploy
- Railway will detect Flask app
- Build takes 2-3 minutes
- You'll see a green checkmark when done

#### 2.5 Get Your Backend URL
- Click your project
- Go to "Settings" → "Domains"
- Copy your domain (e.g., `https://bnplbackend-production.railway.app`)

**SAVE THIS URL** - you'll need it!

#### 2.6 Add Environment Variables

**In Railway Dashboard → Your Project → Variables:**

Add these:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Generate random: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `FLASK_DEBUG` | `False` |
| `FRONTEND_URL` | `https://your-vercel-domain.vercel.app` (you'll update this later) |
| `CORS_ORIGINS` | `https://your-vercel-domain.vercel.app,http://localhost:5173` (update later) |

**For Gmail Credentials:**

Option A (Easier):
- Go to your local `client_secret.json`
- Open it and copy the entire content
- In Railway Variables, add:
  - Key: `GMAIL_CLIENT_SECRETS`
  - Value: Paste entire JSON content

Option B (Better for security):
- In Railway, go to "Files" tab
- Upload your `client_secret.json`
- In Variables, add: `GMAIL_SECRETS_PATH=/app/client_secret.json`

#### 2.7 Redeploy
- After adding variables, go to "Deployments"
- Click the latest deployment
- Click "..." menu → "Redeploy"

---

### STEP 3: Deploy Frontend to Vercel (10 minutes)

#### 3.1 Go to Vercel.com

https://vercel.com

#### 3.2 Sign Up with GitHub
- Click "Sign Up"
- Choose "GitHub"
- Authorize Vercel

#### 3.3 Import Project
- Click "Add New..." → "Project"
- Select your BNPL repo
- Set "Root Directory" to `frontend`

#### 3.4 Configure Build Settings
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: `frontend`

#### 3.5 Add Environment Variables

**Before deploying, add:**

Under "Environment Variables":

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-railway-backend.railway.app` |

#### 3.6 Click Deploy
- Vercel builds and deploys
- Takes 2-3 minutes
- You'll get a domain like: `https://bnpl-guardian.vercel.app`

**SAVE THIS URL** - this is your frontend!

---

### STEP 4: Update Gmail OAuth in Google Cloud Console (5 minutes)

#### 4.1 Go to Google Cloud Console

https://console.cloud.google.com/

#### 4.2 Select Your Project
- Click project dropdown
- Select your BNPL project

#### 4.3 Go to OAuth Consent Screen
- Left menu → "APIs & Services" → "OAuth consent screen"
- Click "Edit"

#### 4.4 Add Authorized Domains

Scroll to "Authorized domains":

```
your-vercel-domain.vercel.app
localhost
```

#### 4.5 Go to Credentials
- Left menu → "Credentials"
- Click your OAuth 2.0 Client ID

#### 4.6 Update Redirect URIs

Under "Authorized redirect URIs", add:

```
https://your-railway-backend.railway.app/auth/callback
http://localhost:5000/auth/callback
```

(Keep existing ones if any)

#### 4.7 Update Authorized JavaScript Origins

This tells Google where your frontend is hosted so Gmail login redirects back correctly.

**Step-by-step:**

1. **You should still be on the Credentials page** (from 4.6)

2. **Look for "Authorized JavaScript origins"** section in the OAuth Client settings

3. **Click the "+ ADD URI" button** to add new origins

4. **Add these three origins** (add each one separately):

   **Origin 1: Your Vercel Frontend**
   ```
   https://your-vercel-domain.vercel.app
   ```
   - Replace `your-vercel-domain` with your actual Vercel domain
   - Example: `https://bnpl-guardian.vercel.app`

   **Origin 2: Local Development (Vite)**
   ```
   http://localhost:5173
   ```

   **Origin 3: Local Development (Alternative)**
   ```
   http://localhost:3000
   ```

5. **After adding each one**, you should see them listed like:
   ```
   ✓ https://bnpl-guardian.vercel.app
   ✓ http://localhost:5173
   ✓ http://localhost:3000
   ```

6. **Verify the list looks correct** before saving

#### 4.8 Save Changes
- Scroll to the bottom of the form
- Click the blue "Save" button
- You should see a success message

**⚠️ Important:** These must match exactly or Gmail login will fail with "Redirect URI mismatch" error

---

### STEP 5: Connect Frontend & Backend (5 minutes)

#### 5.1 Update Railway Environment Variables

Now go back to **Railway Dashboard** → Your Backend Project → Variables

Update:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://your-vercel-domain.vercel.app` |
| `CORS_ORIGINS` | `https://your-vercel-domain.vercel.app,http://localhost:5173` |

#### 5.2 Redeploy Railway

- Go to "Deployments"
- Click latest
- Click "..." → "Redeploy"
- Wait for green checkmark

#### 5.3 Update Vercel Variables

Go to **Vercel Dashboard** → Your Frontend Project → Settings → Environment Variables

Make sure `VITE_API_URL` is set to your Railway URL

- If already there, no change needed
- Vercel auto-redeploys when env vars change

---

### STEP 6: Test the Full Flow (10 minutes)

#### 6.1 Test Locally

First, test that everything still works on localhost:

```bash
# Terminal 1: Backend
set FRONTEND_URL=http://localhost:5173
set CORS_ORIGINS=http://localhost:5173
python app.py
# Should say: Running on http://0.0.0.0:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Should say: VITE v... ready in ... ms
```

Visit http://localhost:5173:
1. See BNPL Guardian landing page ✓
2. Click "Connect with Gmail" ✓
3. Follow Gmail OAuth flow
4. Get redirected back to localhost ✓
5. See onboarding page ✓

#### 6.2 Test Production

Visit your **Vercel frontend URL** (e.g., `https://bnpl-guardian.vercel.app`):

1. See landing page ✓
2. Click "Connect with Gmail" ✓
3. Redirected to Gmail login ✓
4. Get redirected back to your Vercel app ✓
5. See onboarding page ✓
6. Complete profile ✓
7. Dashboard loads with data ✓

**⚠️ If you see a white/blank screen instead:**
See [TROUBLESHOOT_WHITE_SCREEN.md](TROUBLESHOOT_WHITE_SCREEN.md) for step-by-step debugging guide.

---

## Useful Links Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Railway Dashboard | https://railway.app | Manage backend deployments |
| Vercel Dashboard | https://vercel.com | Manage frontend deployments |
| Google Cloud Console | https://console.cloud.google.com | Configure Gmail OAuth |
| Your Frontend | https://your-app.vercel.app | Your deployed app |
| Your Backend API | https://your-backend.railway.app | Your deployed backend |

---

## Environment Variables Quick Reference

### Local Development

**Backend** `.env`:
```
SECRET_KEY=dev-secret
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

**Frontend** `frontend/.env.local`:
```
VITE_API_URL=http://localhost:5000
```

### Production (Set in Dashboards)

**Railway** (Backend):
```
SECRET_KEY=<random>
FRONTEND_URL=https://<vercel-domain>.vercel.app
CORS_ORIGINS=https://<vercel-domain>.vercel.app,http://localhost:5173
GMAIL_CLIENT_SECRETS=<json-content-or-path>
```

**Vercel** (Frontend):
```
VITE_API_URL=https://<railway-domain>.railway.app
```

---

## Troubleshooting

### Problem: White/Blank Screen on Frontend

**Error**: Visit Vercel URL and see blank white page

**Solution**: Follow [TROUBLESHOOT_WHITE_SCREEN.md](TROUBLESHOOT_WHITE_SCREEN.md)

This has a detailed diagnostic checklist to debug the issue.

### Problem: CORS Error in Browser

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Check Vercel dashboard → Settings → Environment Variables
2. Verify `VITE_API_URL` is your Railway URL
3. Go to Railway → Variables
4. Verify `CORS_ORIGINS` includes your Vercel domain
5. Redeploy Railway

### Problem: Gmail Login Goes to Wrong URL

**Error**: Redirects to GitHub Pages or wrong domain

**Solution**:
1. Check Railway → Variables
2. Verify `FRONTEND_URL` is exactly your Vercel URL
3. No trailing slash needed
4. Redeploy Railway

### Problem: 404 on /auth/callback

**Error**: "This site can't be reached" after Gmail login

**Solution**:
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Add redirect URI: `https://your-railway.railway.app/auth/callback`
5. Save
6. Redeploy Railway

### Problem: Backend Won't Start/Error in Railway Logs

**Solution**:
1. Railway Dashboard → Your Project → Deployments
2. Click latest deployment
3. Check logs for errors
4. Common issues:
   - Missing environment variable
   - Syntax error in app.py
   - Missing dependency in requirements.txt
5. Fix locally, push to GitHub, Railway auto-redeploys

### Problem: Frontend Won't Build

**Error**: Build fails in Vercel

**Solution**:
1. Vercel Dashboard → Deployments → View logs
2. Check for build errors
3. Common issues:
   - React/import errors
   - Missing dependency in package.json
4. Fix locally, `npm run build` to test
5. Push to GitHub, Vercel auto-redeploys

---

## After Deployment: Monitoring

### Check Backend is Running

```
curl https://your-backend.railway.app/api/health
```

Should return: `{"status":"ok"}`

### Check Frontend is Accessible

Just visit: `https://your-app.vercel.app`

Should load BNPL Guardian landing page

### View Logs

**Railway**:
- Go to project → Deployments
- Click deployment → View logs

**Vercel**:
- Go to project → Deployments
- Click deployment → View logs

---

## Going Forward

### To Update Code:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both Railway and Vercel automatically redeploy!

### To Update Environment Variables:

1. **Railway**: Go to Variables → edit → Redeploy
2. **Vercel**: Go to Settings → Environment Variables → update → Auto-redeploys

### Local Development Still Works:

Keep developing locally with `npm run dev` and `python app.py`

Use `.env` and `.env.local` files (never commit them)

---

## Summary

You now have:

✅ **Frontend** hosted on Vercel (auto-deploys on git push)
✅ **Backend** hosted on Railway (auto-deploys on git push)
✅ **Gmail OAuth** configured for both domains
✅ **No credentials in GitHub** - all in environment variables
✅ **Development** still works locally
✅ **Secure** - sensitive data not exposed

The app is live at:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.railway.app`

---

## Questions?

Check the logs:
- Railway: Project → Deployments → view logs
- Vercel: Project → Deployments → view logs

Or run locally first:
```bash
python app.py
cd frontend && npm run dev
```

Let me know if you hit any issues!
