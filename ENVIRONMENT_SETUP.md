# Environment Variables Setup Guide

## Overview
This guide explains all environment variables needed for BNPL Guardian deployment.

---

## Backend Environment Variables

### Development (Local)

Create `.env` file in project root:

```env
# Flask Configuration
SECRET_KEY=dev-secret-key-change-in-production
OAUTHLIB_INSECURE_TRANSPORT=1

# CORS Configuration (allow local development)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# Google OAuth (from client_secret.json)
# These are automatically loaded from client_secret.json
```

### Production (GitHub Pages + Heroku/Railway/Render)

Set these in your backend service's environment variables:

```env
# Flask Configuration
SECRET_KEY=your-random-secret-key-min-32-chars
OAUTHLIB_INSECURE_TRANSPORT=1

# CORS Configuration (allow GitHub Pages and local dev)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/

# Frontend URL (for OAuth redirects)
FRONTEND_URL=https://yourusername.github.io/bnpl_clean/

# Google OAuth (from client_secret.json)
# These are automatically loaded from client_secret.json
```

**Replace**:
- `your-random-secret-key-min-32-chars` with a random string (min 32 characters)
- `yourusername` with your GitHub username

---

## Frontend Environment Variables

### Development

File: `frontend/.env.development`

```env
VITE_API_URL=http://localhost:5000
```

This is already configured. No changes needed for local development.

### Production

#### Option A: GitHub Secrets (Recommended)

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-backend-url.herokuapp.com` |

Replace `your-backend-url` with your actual backend URL.

#### Option B: Environment File

File: `frontend/.env.production`

```env
VITE_API_URL=https://your-backend-url.herokuapp.com
```

Replace `your-backend-url` with your actual backend URL.

---

## How to Generate SECRET_KEY

### Option 1: Python

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Option 2: OpenSSL

```bash
openssl rand -hex 32
```

### Option 3: Online Generator

Use an online random string generator and copy a 32+ character string.

---

## Setting Environment Variables by Service

### Heroku

```bash
heroku config:set SECRET_KEY=your-random-secret-key
heroku config:set OAUTHLIB_INSECURE_TRANSPORT=1
heroku config:set CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
heroku config:set FRONTEND_URL=https://yourusername.github.io/bnpl_clean/
```

### Railway

1. Go to Railway dashboard
2. Select your project
3. Click "Variables" tab
4. Add each variable:
   - `SECRET_KEY`
   - `OAUTHLIB_INSECURE_TRANSPORT`
   - `CORS_ORIGINS`
   - `FRONTEND_URL`

### Render

1. Go to Render dashboard
2. Select your service
3. Click "Environment" tab
4. Add each variable:
   - `SECRET_KEY`
   - `OAUTHLIB_INSECURE_TRANSPORT`
   - `CORS_ORIGINS`
   - `FRONTEND_URL`

---

## GitHub Actions Secrets

For automated deployment, add to GitHub:

1. Go to repository Settings
2. Secrets and variables → Actions
3. Add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | Your backend URL |

The GitHub Actions workflow will use this secret during build:

```yaml
env:
  VITE_API_URL: ${{ secrets.VITE_API_URL }}
```

---

## Verification

### Test Backend

```bash
# Should return {"status":"ok"}
curl https://your-backend-url.herokuapp.com/api/health
```

### Test Frontend Build

```bash
cd frontend
VITE_API_URL=https://your-backend-url.herokuapp.com npm run build
```

### Check Built Files

```bash
# Should contain index.html and other assets
ls -la frontend/dist/
```

---

## Common Issues

### Issue: "SECRET_KEY not set"

**Solution**: Set `SECRET_KEY` in backend environment variables

### Issue: "CORS errors in console"

**Solution**: Verify `CORS_ORIGINS` includes your GitHub Pages URL

### Issue: "Backend service unavailable"

**Solution**: Verify `VITE_API_URL` is set correctly in GitHub secrets

### Issue: "OAuth redirect failed"

**Solution**: Verify `FRONTEND_URL` matches your GitHub Pages URL

---

## Environment Variable Checklist

### Backend (Heroku/Railway/Render)

- [ ] `SECRET_KEY` set (32+ characters)
- [ ] `OAUTHLIB_INSECURE_TRANSPORT` set to `1`
- [ ] `CORS_ORIGINS` includes GitHub Pages URL
- [ ] `FRONTEND_URL` set to GitHub Pages URL
- [ ] `client_secret.json` uploaded or configured

### Frontend (GitHub)

- [ ] `VITE_API_URL` secret added to GitHub
- [ ] Value is correct backend URL
- [ ] No trailing slash in URL

### Local Development

- [ ] `.env` file created in project root
- [ ] `frontend/.env.development` exists
- [ ] `VITE_API_URL=http://localhost:5000` in dev file

---

## Reference

### Backend URL Examples

- Heroku: `https://bnpl-guardian-backend.herokuapp.com`
- Railway: `https://bnpl-guardian-backend.railway.app`
- Render: `https://bnpl-guardian-backend.onrender.com`

### GitHub Pages URL

```
https://yourusername.github.io/bnpl_clean/
```

### CORS_ORIGINS Format

```
http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
```

(Comma-separated, no spaces)

---

**Status**: ✅ Ready to configure

**Next Steps**:
1. Generate `SECRET_KEY`
2. Deploy backend with environment variables
3. Add `VITE_API_URL` to GitHub secrets
4. Push to main branch
5. Monitor GitHub Actions deployment
