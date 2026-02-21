# OAuth Redirect URI Fix - Google Cloud Console Configuration

## Problem
After clicking "Connect with Google", you're being redirected to `localhost` instead of your backend URL. This happens because:

1. Google OAuth is configured in Google Cloud Console with only `localhost` redirect URIs
2. When you deploy to production, the redirect URI needs to match your backend URL
3. The backend needs to know its own URL via `BACKEND_URL` environment variable

---

## Solution

### Step 1: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (should be "Web application")
5. Click on it to edit
6. Under "Authorized redirect URIs", add:

**For Local Development:**
```
http://localhost:5000/auth/callback
```

**For Production (Heroku/Railway/Render):**
```
https://your-backend-url.herokuapp.com/auth/callback
```

Replace `your-backend-url` with your actual backend URL.

**Example for Heroku:**
```
https://bnpl-guardian-backend.herokuapp.com/auth/callback
```

7. Click **Save**

---

### Step 2: Set BACKEND_URL Environment Variable

The backend uses `BACKEND_URL` to determine the correct redirect URI.

#### For Local Development
No action needed - defaults to `http://localhost:5000`

#### For Production (Heroku)
```bash
heroku config:set BACKEND_URL=https://bnpl-guardian-backend.herokuapp.com
```

#### For Production (Railway)
1. Go to Railway dashboard
2. Select your project
3. Click "Variables" tab
4. Add: `BACKEND_URL` = `https://your-railway-url.railway.app`

#### For Production (Render)
1. Go to Render dashboard
2. Select your service
3. Click "Environment" tab
4. Add: `BACKEND_URL` = `https://your-render-url.onrender.com`

---

### Step 3: Update client_secret.json (If Using Local File)

If you're using `client_secret.json` for local development, it should already have the correct redirect URIs from Google Cloud Console.

If not, download it again:
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Click "Download JSON" button
5. Replace your local `client_secret.json`

---

## How It Works

### Local Development Flow
```
1. User clicks "Connect with Google"
2. Frontend redirects to: http://localhost:5000/api/login
3. Backend creates OAuth flow with redirect_uri: http://localhost:5000/auth/callback
4. User logs in with Google
5. Google redirects to: http://localhost:5000/auth/callback
6. Backend processes callback
7. Backend redirects to: http://localhost:3000/dashboard
8. User sees dashboard
```

### Production Flow
```
1. User clicks "Connect with Google"
2. Frontend redirects to: https://your-backend-url/api/login
3. Backend creates OAuth flow with redirect_uri: https://your-backend-url/auth/callback
4. User logs in with Google
5. Google redirects to: https://your-backend-url/auth/callback
6. Backend processes callback
7. Backend redirects to: https://yourusername.github.io/bnpl_clean/dashboard
8. User sees dashboard
```

---

## Environment Variables

### Backend

#### Local Development
```env
# No BACKEND_URL needed - defaults to http://localhost:5000
```

#### Production
```env
BACKEND_URL=https://your-backend-url.herokuapp.com
FRONTEND_URL=https://yourusername.github.io/bnpl_clean/
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
```

---

## Troubleshooting

### Issue: "Redirect URI mismatch"
**Error**: `redirect_uri_mismatch` from Google

**Cause**: The redirect URI in your code doesn't match what's configured in Google Cloud Console

**Solution**:
1. Check your `BACKEND_URL` environment variable
2. Verify it matches the redirect URI in Google Cloud Console
3. Make sure there's no trailing slash
4. Wait 5 minutes for Google to update

### Issue: Still redirecting to localhost
**Cause**: `BACKEND_URL` not set or incorrect

**Solution**:
1. Verify `BACKEND_URL` is set: `heroku config` (for Heroku)
2. Check it matches your backend URL exactly
3. Redeploy backend
4. Clear browser cache

### Issue: "Invalid client" error
**Cause**: Client ID or secret is wrong

**Solution**:
1. Download fresh `client_secret.json` from Google Cloud Console
2. Or set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
3. Redeploy backend

---

## Complete Setup Checklist

### Google Cloud Console
- [ ] OAuth 2.0 Client ID created
- [ ] `http://localhost:5000/auth/callback` added to redirect URIs
- [ ] `https://your-backend-url/auth/callback` added to redirect URIs
- [ ] `client_secret.json` downloaded

### Backend Environment Variables
- [ ] `BACKEND_URL` set to your backend URL (production only)
- [ ] `FRONTEND_URL` set to your GitHub Pages URL
- [ ] `CORS_ORIGINS` includes your GitHub Pages URL
- [ ] `SECRET_KEY` set

### Local Development
- [ ] `client_secret.json` in project root
- [ ] Backend running on `http://localhost:5000`
- [ ] Frontend running on `http://localhost:3000` or `http://localhost:5173`

### Production
- [ ] Backend deployed to Heroku/Railway/Render
- [ ] `BACKEND_URL` environment variable set
- [ ] `FRONTEND_URL` environment variable set
- [ ] Google Cloud Console redirect URIs updated
- [ ] GitHub Pages enabled

---

## Testing

### Test Local Development
```bash
# 1. Start backend
python app.py

# 2. Start frontend
cd frontend && npm run dev

# 3. Go to http://localhost:3000
# 4. Click "Connect with Google"
# 5. Should redirect to Google login
# 6. After login, should redirect to http://localhost:3000/dashboard
```

### Test Production
```bash
# 1. Visit https://yourusername.github.io/bnpl_clean/
# 2. Click "Connect with Google"
# 3. Should redirect to Google login
# 4. After login, should redirect to https://yourusername.github.io/bnpl_clean/dashboard
```

---

## Reference

### Redirect URI Format

**Local Development:**
```
http://localhost:5000/auth/callback
```

**Heroku:**
```
https://bnpl-guardian-backend.herokuapp.com/auth/callback
```

**Railway:**
```
https://your-app-name.railway.app/auth/callback
```

**Render:**
```
https://your-app-name.onrender.com/auth/callback
```

### Environment Variables

```env
# Backend
BACKEND_URL=https://your-backend-url.com
FRONTEND_URL=https://yourusername.github.io/bnpl_clean/
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourusername.github.io/bnpl_clean/
SECRET_KEY=your-secret-key
OAUTHLIB_INSECURE_TRANSPORT=1

# Or use Google credentials from environment
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_PROJECT_ID=your-project-id
```

---

## How Backend Determines Redirect URI

The `create_flow()` function in `backend/gmail_service.py` determines the redirect URI with this priority:

1. **Use `BACKEND_URL` environment variable** (if set)
   ```python
   backend_base = os.getenv("BACKEND_URL")
   ```

2. **Use current request URL** (if `BACKEND_URL` not set)
   ```python
   backend_base = request.url_root.rstrip("/")
   ```

3. **Fallback to localhost** (if both above fail)
   ```python
   backend_base = "http://localhost:5000"
   ```

Then it appends `/auth/callback`:
```python
redirect_uri = f"{backend_base}/auth/callback"
```

---

## Summary

**For Local Development:**
1. Add `http://localhost:5000/auth/callback` to Google Cloud Console
2. No environment variables needed
3. Should work automatically

**For Production:**
1. Add `https://your-backend-url/auth/callback` to Google Cloud Console
2. Set `BACKEND_URL` environment variable on backend
3. Set `FRONTEND_URL` environment variable on backend
4. Test OAuth flow

---

## Next Steps

1. Go to Google Cloud Console
2. Add your backend URL to redirect URIs
3. Set `BACKEND_URL` environment variable (production only)
4. Test OAuth flow
5. If still having issues, check browser console and backend logs

---

**Status**: ✅ Ready to fix

**Time to implement**: ~5 minutes

**Questions?** Check the troubleshooting section above.
