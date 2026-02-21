# BNPL Guardian - GitHub Pages Deployment Checklist

## Overview
This guide walks you through deploying BNPL Guardian to GitHub Pages with a separate backend service.

## Prerequisites
- GitHub account with repository access
- Backend deployed to Heroku, Railway, or Render
- Node.js 18+ installed locally

---

## Step 1: Deploy Backend Service

Choose ONE of the following options:

### Option A: Heroku (Recommended for beginners)

```bash
# 1. Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create a new app
heroku create bnpl-guardian-backend

# 4. Set environment variables
heroku config:set SECRET_KEY=your-random-secret-key
heroku config:set OAUTHLIB_INSECURE_TRANSPORT=1
heroku config:set CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
heroku config:set FRONTEND_URL=https://yourusername.github.io/bnpl_clean/

# 5. Deploy
git push heroku main

# 6. Get your backend URL
heroku apps:info bnpl-guardian-backend
# Your URL will be: https://bnpl-guardian-backend.herokuapp.com
```

### Option B: Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python
5. Add environment variables in Railway dashboard:
   - `SECRET_KEY`: your-random-secret-key
   - `OAUTHLIB_INSECURE_TRANSPORT`: 1
   - `CORS_ORIGINS`: http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
   - `FRONTEND_URL`: https://yourusername.github.io/bnpl_clean/
6. Deploy and get your backend URL

### Option C: Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: bnpl-guardian-backend
   - Environment: Python 3
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app:app`
5. Add environment variables (same as above)
6. Deploy and get your backend URL

---

## Step 2: Configure GitHub Repository

### 2.1 Add Repository Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-backend-url.herokuapp.com` (or Railway/Render URL) |

Replace `your-backend-url` with your actual backend URL from Step 1.

### 2.2 Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** (will be created by GitHub Actions)
   - Folder: **/ (root)**
3. Click **Save**

---

## Step 3: Update Backend CORS Configuration

Update your backend's `CORS_ORIGINS` environment variable to include your GitHub Pages URL:

```
http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
```

Replace `yourusername` with your actual GitHub username.

---

## Step 4: Verify GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` should already exist. Verify it:

1. Go to your repository
2. Click **Actions** tab
3. You should see "Deploy to GitHub Pages" workflow
4. If not present, the file was created at `.github/workflows/deploy.yml`

---

## Step 5: Deploy Frontend

### Option A: Automatic (Recommended)

```bash
# 1. Commit and push your changes
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main

# 2. GitHub Actions will automatically:
#    - Install dependencies
#    - Build the frontend with VITE_API_URL secret
#    - Deploy to GitHub Pages
#    - Create gh-pages branch

# 3. Monitor the deployment:
#    - Go to Actions tab
#    - Watch "Deploy to GitHub Pages" workflow
#    - Wait for green checkmark
```

### Option B: Manual Build and Deploy

```bash
# 1. Build locally
cd frontend
VITE_API_URL=https://your-backend-url.herokuapp.com npm run build

# 2. Install gh-pages package
npm install --save-dev gh-pages

# 3. Deploy
npx gh-pages -d dist

# 4. GitHub Pages will be updated automatically
```

---

## Step 6: Verify Deployment

1. Go to `https://yourusername.github.io/bnpl_clean/`
2. You should see the BNPL Guardian login page
3. Try logging in with your Google account
4. If successful, you're all set!

---

## Troubleshooting

### Issue: "Backend service is unavailable"

**Cause**: Backend URL not set or incorrect

**Solution**:
1. Verify `VITE_API_URL` secret is set in GitHub
2. Check backend is running and accessible
3. Verify backend URL is correct (no trailing slash)

```bash
# Test backend URL
curl https://your-backend-url.herokuapp.com/api/health
# Should return: {"status":"ok"}
```

### Issue: CORS errors in browser console

**Cause**: Backend doesn't allow requests from GitHub Pages

**Solution**:
1. Update `CORS_ORIGINS` in backend environment variables
2. Include your GitHub Pages URL: `https://yourusername.github.io/bnpl_clean/`
3. Redeploy backend
4. Wait 5 minutes for changes to take effect

### Issue: 404 errors on page refresh

**Cause**: GitHub Pages doesn't know about your routes

**Solution**:
- The `frontend/public/404.html` file handles this automatically
- Verify it exists in your repository
- Rebuild and redeploy if needed

### Issue: Blank page or infinite redirect

**Cause**: Vite base path configuration issue

**Solution**:
1. Verify `frontend/vite.config.js` has correct base path:
   ```javascript
   base: process.env.NODE_ENV === 'production' ? '/bnpl_clean/' : '/',
   ```
2. Rebuild: `cd frontend && npm run build`
3. Redeploy

### Issue: GitHub Actions workflow not running

**Cause**: Workflow file not found or syntax error

**Solution**:
1. Verify `.github/workflows/deploy.yml` exists
2. Check file syntax (YAML format)
3. Commit and push the file
4. Go to Actions tab and manually trigger workflow

---

## Environment Variables Reference

### Backend (.env or service config)

```
SECRET_KEY=your-random-secret-key
OAUTHLIB_INSECURE_TRANSPORT=1
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
FRONTEND_URL=https://yourusername.github.io/bnpl_clean/
```

### Frontend (GitHub Secrets)

```
VITE_API_URL=https://your-backend-url.herokuapp.com
```

### Frontend Local Development

```
# frontend/.env.development
VITE_API_URL=http://localhost:5000
```

---

## Complete Deployment Checklist

- [ ] Backend deployed to Heroku/Railway/Render
- [ ] Backend URL obtained (e.g., https://bnpl-guardian-backend.herokuapp.com)
- [ ] `VITE_API_URL` secret added to GitHub repository
- [ ] `CORS_ORIGINS` updated on backend with GitHub Pages URL
- [ ] `FRONTEND_URL` updated on backend
- [ ] GitHub Pages enabled in repository settings
- [ ] `.github/workflows/deploy.yml` exists in repository
- [ ] `frontend/public/404.html` exists in repository
- [ ] `frontend/vite.config.js` has correct base path
- [ ] Changes committed and pushed to main branch
- [ ] GitHub Actions workflow completed successfully
- [ ] GitHub Pages URL accessible (https://yourusername.github.io/bnpl_clean/)
- [ ] Login page loads correctly
- [ ] Google OAuth login works
- [ ] Dashboard loads and displays data
- [ ] API calls to backend working

---

## Quick Reference

### Your GitHub Pages URL
```
https://yourusername.github.io/bnpl_clean/
```

### Your Backend URL (from Step 1)
```
https://your-backend-url.herokuapp.com
```

### Test Backend Health
```bash
curl https://your-backend-url.herokuapp.com/api/health
```

### View GitHub Actions Logs
1. Go to repository
2. Click **Actions** tab
3. Click latest workflow run
4. Click **build-and-deploy** job
5. Expand steps to see logs

---

## Support

If you encounter issues:

1. Check GitHub Actions logs for build errors
2. Verify backend is running: `curl https://your-backend-url.herokuapp.com/api/health`
3. Check browser console for CORS errors
4. Verify all environment variables are set correctly
5. Check backend logs for errors

---

**Status**: ✅ Ready for deployment

**Next Steps**:
1. Deploy backend to Heroku/Railway/Render
2. Add `VITE_API_URL` secret to GitHub
3. Push to main branch
4. Monitor GitHub Actions
5. Verify at GitHub Pages URL
