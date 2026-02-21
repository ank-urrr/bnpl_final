# Quick Deployment Checklist

## Step 1: Prepare for Deployment (Do This First)

- [ ] Verify `.gitignore` contains:
  ```
  *.env
  .env.local
  client_secret.json
  credentials.json
  ```

- [ ] Remove sensitive files from git history:
  ```bash
  git rm --cached .env
  git rm --cached client_secret.json
  mkdir -p backend/.env
  ```

- [ ] Check what's staged:
  ```bash
  git status
  # Should NOT show .env or client_secret.json
  ```

---

## Step 2: Backend Setup (Railway)

### 2a. Deploy to Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your `bnplbackend` repository
5. Railway auto-detects Flask and deploys

### 2b. Get Your Railway Backend URL
- After deployment, go to Settings → Domains
- Copy your domain: `https://bnplbackend-production.railway.app` (example)

### 2c. Set Environment Variables in Railway

Go to your Railway project → Variables:

```
SECRET_KEY=<generate-a-random-string>
FRONTEND_URL=https://<your-vercel-domain>.vercel.app
CORS_ORIGINS=https://<your-vercel-domain>.vercel.app,http://localhost:3000,http://localhost:5173
```

**IMPORTANT**: For Gmail credentials, you have two options:

**Option A: Upload client_secret.json to Railway**
```
GMAIL_CLIENT_SECRETS={paste-entire-client_secret.json-content-here}
```

**Option B: Upload to Railway Files (Better)**
1. Railway Dashboard → Project → Files tab
2. Upload `client_secret.json`
3. Set path in environment: `GMAIL_SECRETS_PATH=/app/client_secret.json`
4. Update [backend/gmail_service.py](backend/gmail_service.py) to use this path

---

## Step 3: Frontend Setup (Vercel)

### 3a. Deploy to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Select your BNPL repository
5. Set Root Directory: `frontend`
6. Click Deploy

### 3b. Get Your Vercel Frontend URL
- After deployment: `https://<your-project>.vercel.app`

### 3c. Set Environment Variables in Vercel

Go to Settings → Environment Variables:

```
VITE_API_URL=https://<your-railway-backend>.railway.app
```

---

## Step 4: Update Gmail OAuth

### 4a. Go to Google Cloud Console
- https://console.cloud.google.com
- Select your project

### 4b. Update OAuth 2.0 Consent Screen

Authorized JavaScript Origins:
```
https://<your-vercel-domain>.vercel.app
http://localhost:3000
http://localhost:5173
```

Authorized Redirect URIs:
```
https://<your-railway-backend>.railway.app/auth/callback
http://localhost:5000/auth/callback
```

---

## Step 5: Update Backend for Railway

### 5a. Check [app.py](app.py) has this:

Around line 20-25:
```python
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
CORS(app, supports_credentials=True, origins=cors_origins)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
```

### 5b. Check [Procfile](Procfile) says:
```
web: python app.py
```

### 5c. Update [app.py](app.py) bottom:
```python
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

---

## Step 6: Test Locally First

```bash
# Terminal 1: Backend
export FRONTEND_URL=http://localhost:5173
export CORS_ORIGINS=http://localhost:5173
python app.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit http://localhost:5173 → Test login flow

---

## Step 7: Push to GitHub

```bash
git add .
git commit -m "Configure for production hosting"
git push origin main
```

Both Railway and Vercel auto-deploy on push!

---

## Step 8: Verify Everything Works

- [ ] Visit Vercel frontend URL
- [ ] Click "Connect with Gmail"
- [ ] Gmail login works
- [ ] Redirects back to Vercel
- [ ] Dashboard loads
- [ ] Data syncs from Gmail

---

## Production Addresses

```
Frontend:   https://<your-project>.vercel.app
Backend:    https://<your-project>.railway.app
```

---

## Troubleshooting

### CORS Error in Browser Console
- Check `CORS_ORIGINS` in Railway includes your Vercel domain
- Restart Railway deployment after changing variables

### Redirect to Wrong URL
- Check `FRONTEND_URL` in Railway
- Should be `https://<your-vercel>.vercel.app` (no trailing slash)

### Gmail Login Returns 404
- Check `https://<your-railway>.railway.app/auth/callback` is in Google OAuth settings

### Backend Connection Failed
- Check `VITE_API_URL` in Vercel is correct
- Check backend is actually running in Railway

---

## Local Development (.env files - NEVER commit)

### Backend `.env`
```
SECRET_KEY=dev-secret-123
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

### Frontend `frontend/.env.local`
```
VITE_API_URL=http://localhost:5000
```

---

## Key Points

1. **NEVER push credentials to GitHub** - use environment variables
2. **Frontend and Backend on different domains** - must configure CORS
3. **Environment variables must match** - backend FRONTEND_URL must equal Vercel domain
4. **Both services auto-deploy** - just push to GitHub
5. **Gmail API needs both URLs** - update Google Console for production URLs

Let me know which step you're on and I can help!
