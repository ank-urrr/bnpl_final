# GitHub Pages Deployment Guide

## Problem
GitHub Pages is a static hosting service - it cannot run a backend server. The frontend is trying to connect to `http://localhost:5000` which doesn't exist on GitHub Pages.

## Solution
You need to deploy the backend separately and configure the frontend to use that backend URL.

## Step 1: Deploy Backend

### Option A: Deploy to Heroku (Recommended)

**Prerequisites:**
- Heroku account (free tier available)
- Heroku CLI installed

**Steps:**
```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create bnpl-guardian-backend

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set OAUTHLIB_INSECURE_TRANSPORT=1

# Deploy backend
git push heroku main

# Get your backend URL
heroku apps:info bnpl-guardian-backend
# URL will be: https://bnpl-guardian-backend.herokuapp.com
```

### Option B: Deploy to Railway

**Steps:**
1. Go to https://railway.app
2. Connect your GitHub repository
3. Select the Python environment
4. Set environment variables
5. Deploy

### Option C: Deploy to Render

**Steps:**
1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python app.py`
6. Deploy

## Step 2: Configure Frontend for GitHub Pages

### Update Environment Variables

**Create/Update `frontend/.env.production`:**
```
VITE_API_URL=https://your-backend-url.herokuapp.com
```

Replace `https://your-backend-url.herokuapp.com` with your actual backend URL.

### Build and Deploy

```bash
# Build frontend
cd frontend
npm run build

# The build output will be in frontend/dist/

# Deploy to GitHub Pages using GitHub Actions or manually
```

## Step 3: GitHub Actions Workflow (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: cd frontend && npm install
    
    - name: Build
      run: cd frontend && npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./frontend/dist
```

### Add Secret to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `VITE_API_URL`
5. Value: `https://your-backend-url.herokuapp.com`
6. Click "Add secret"

## Step 4: Update Backend for CORS

Your backend needs to allow requests from GitHub Pages. Update `app.py`:

```python
from flask_cors import CORS

CORS(app, 
     supports_credentials=True, 
     origins=[
         "http://localhost:3000",
         "http://localhost:5173",
         "https://yourusername.github.io"  # Add your GitHub Pages URL
     ])
```

## Step 5: Verify Deployment

1. Go to `https://yourusername.github.io/bnpl_clean/`
2. You should see the login page
3. Try logging in
4. If it works, you're all set!

## Troubleshooting

### Issue: "Backend service is unavailable"

**Cause:** Backend URL is not set or incorrect

**Solution:**
1. Check `VITE_API_URL` environment variable
2. Verify backend is running and accessible
3. Check CORS configuration on backend

### Issue: CORS errors in console

**Cause:** Backend doesn't allow requests from GitHub Pages

**Solution:**
1. Update CORS configuration in `app.py`
2. Add your GitHub Pages URL to allowed origins
3. Redeploy backend

### Issue: 404 errors on page refresh

**Cause:** GitHub Pages doesn't know about your routes

**Solution:**
Create `frontend/public/404.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>BNPL Guardian</title>
    <script type="text/javascript">
      var pathSegmentsToKeep = 1;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/')
          .replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
  </body>
</html>
```

## Environment Variables Reference

### Development
```
VITE_API_URL=http://localhost:5000
```

### Production (GitHub Pages)
```
VITE_API_URL=https://your-backend-url.herokuapp.com
```

## Files Modified/Created

```
frontend/
├── .env.development (NEW)
├── .env.production (NEW)
├── src/api/axios.js (UPDATED)
└── public/404.html (NEW - for routing)

.github/
└── workflows/
    └── deploy.yml (NEW - for CI/CD)
```

## Complete Deployment Checklist

- [ ] Backend deployed to Heroku/Railway/Render
- [ ] Backend URL obtained
- [ ] `VITE_API_URL` environment variable set
- [ ] CORS configured on backend
- [ ] GitHub Actions workflow created
- [ ] Repository secret `VITE_API_URL` added
- [ ] Frontend built and deployed
- [ ] GitHub Pages URL verified
- [ ] Login tested
- [ ] Dashboard loads correctly
- [ ] API calls working

## Quick Reference

### Local Development
```bash
# Terminal 1: Backend
python app.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Production Build
```bash
cd frontend
VITE_API_URL=https://your-backend-url.herokuapp.com npm run build
```

### Deploy to GitHub Pages
```bash
# Using GitHub Actions (automatic)
git push origin main

# Or manually
npm run build
npx gh-pages -d dist
```

## Support

If you encounter issues:

1. Check backend is running and accessible
2. Verify `VITE_API_URL` is correct
3. Check browser console for errors
4. Check backend logs for CORS issues
5. Verify GitHub Pages URL is correct

---

**Status**: ✅ Ready for deployment

**Next Steps**: 
1. Deploy backend to Heroku/Railway/Render
2. Set `VITE_API_URL` environment variable
3. Push to GitHub to trigger deployment
4. Verify at GitHub Pages URL