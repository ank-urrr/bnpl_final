# Fix OAuth Redirect - Quick Action Guide

## The Problem
After clicking "Connect with Google", you're redirected to `localhost` instead of your backend URL.

## The Solution (5 minutes)

### Step 1: Update Google Cloud Console (2 min)

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID (Web application)
5. Under "Authorized redirect URIs", add:

**For Local Development:**
```
http://localhost:5000/auth/callback
```

**For Production (Heroku):**
```
https://bnpl-guardian-backend.herokuapp.com/auth/callback
```

(Replace with your actual backend URL)

6. Click **Save**

### Step 2: Set Backend URL (2 min)

**For Heroku:**
```bash
heroku config:set BACKEND_URL=https://bnpl-guardian-backend.herokuapp.com
```

**For Railway:**
1. Go to Railway dashboard
2. Select your project
3. Click "Variables"
4. Add: `BACKEND_URL` = `https://your-railway-url.railway.app`

**For Render:**
1. Go to Render dashboard
2. Select your service
3. Click "Environment"
4. Add: `BACKEND_URL` = `https://your-render-url.onrender.com`

### Step 3: Test (1 min)

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to your app
3. Click "Connect with Google"
4. Should now redirect correctly

---

## Why This Happens

Google OAuth requires you to register all redirect URIs in advance. The backend uses `BACKEND_URL` to tell Google where to redirect after login.

**Without BACKEND_URL:**
- Backend defaults to `http://localhost:5000`
- Google redirects to `localhost`
- Doesn't work in production

**With BACKEND_URL:**
- Backend uses your production URL
- Google redirects to your production backend
- Works everywhere

---

## Redirect URI Format

```
https://your-backend-url.com/auth/callback
```

**Examples:**
- Heroku: `https://bnpl-guardian-backend.herokuapp.com/auth/callback`
- Railway: `https://bnpl-guardian-backend.railway.app/auth/callback`
- Render: `https://bnpl-guardian-backend.onrender.com/auth/callback`

---

## Troubleshooting

### Still redirecting to localhost?
1. Check `BACKEND_URL` is set: `heroku config` (for Heroku)
2. Verify it matches your backend URL exactly
3. Clear browser cache
4. Restart backend

### "Redirect URI mismatch" error?
1. Check Google Cloud Console has the correct URI
2. Make sure there's no trailing slash
3. Wait 5 minutes for Google to update

### "Invalid client" error?
1. Download fresh `client_secret.json` from Google Cloud Console
2. Or set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables

---

## Done!

Your OAuth flow should now work correctly. Test it by clicking "Connect with Google" again.

For more details, see `OAUTH_REDIRECT_FIX.md`.
