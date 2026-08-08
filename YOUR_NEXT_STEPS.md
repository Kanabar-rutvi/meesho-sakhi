# ⚡ YOUR NEXT STEPS — Meesho Sakhi Deployment

## Right Now (5 Minutes)

### 1. Test Locally
```bash
cd backend
python -m uvicorn main:app --reload --port 8000

# New terminal:
cd frontend
npm run dev

# Open http://localhost:5173
# Console should show: [Meesho Sakhi] API Base URL: http://localhost:8000
# Try shopping → verify it works
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Production deployment configuration"
git push
```

---

## Today (30 Minutes - Deploy Backend)

### Choose Your Backend Hosting

**Railway (Recommended):** 
- Simplest, free tier available
- No configuration file needed

**Heroku:**
- Need to create `backend/Procfile`

**AWS/Other:**
- More complex, skip if unsure

### Railway Deployment

1. Go to https://railway.app/ → Sign up (GitHub login)
2. Click "Create new project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Python
6. Set these fields:
   - Service name: meesho-sakhi-backend (optional)
   - Root directory: `backend/` ← IMPORTANT
7. Click "Deploy"
8. In Railway dashboard, go to **Variables**:
   ```
   ANTHROPIC_API_KEY = sk-ant-v0-xxxxx...
   (Get from https://console.anthropic.com/)
   
   ALLOWED_ORIGINS = https://yourdomain.vercel.app
   (Use placeholder for now, update after Vercel deployment)
   ```
9. Wait for deployment (2-5 minutes)
10. **Get your Railway URL** from the dashboard
    - Example: `https://meesho-sakhi-backend-production.up.railway.app`
    - Test it: Open URL in browser → should see API info

---

## Today (30 Minutes - Deploy Frontend)

### Vercel Deployment

1. Go to https://vercel.com/ → Sign up (GitHub login)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure deployment:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **CRITICAL - Add Environment Variable BEFORE deploying:**
   - Name: `VITE_API_URL`
   - Value: `https://your-railway-url` (from previous step, NO trailing slash)
   - Example: `https://meesho-sakhi-backend-production.up.railway.app`
6. Click "Deploy"
7. Wait for deployment (1-2 minutes)
8. **Get your Vercel URL** from deployment screen
   - Example: `https://meesho-sakhi.vercel.app`

---

## After Both Deployments (10 Minutes)

### Update Backend CORS Settings

1. Go back to Railway dashboard
2. Go to **Variables** for your backend service
3. Update `ALLOWED_ORIGINS`:
   ```
   https://your-vercel-url.vercel.app,https://your-railway-url
   ```
   Example:
   ```
   https://meesho-sakhi.vercel.app,https://meesho-sakhi-backend-production.up.railway.app
   ```
4. **Redeploy** (click "Redeploy" button or push new commit)

### Verify Everything Works

```bash
# 1. Test backend health
curl https://your-railway-url/health
# Should return: {"status":"ok",...}

# 2. Test backend API
curl -X POST https://your-railway-url/shop \
  -H "Content-Type: application/json" \
  -d '{"query":"affordable shoes"}'
# Should return Server-Sent Events stream, NOT 404

# 3. Open frontend in browser
# https://your-vercel-url.vercel.app
# 
# 4. Open Developer Console (F12)
# Check console for: [Meesho Sakhi] API Base URL: https://your-railway-url
#
# 5. Try shopping
# Should work without 404 errors
```

---

## If Vercel Doesn't Redeploy Automatically

Sometimes after adding `VITE_API_URL`, Vercel needs a manual redeploy:

1. Go to https://vercel.com/dashboard
2. Select your Meesho Sakhi project
3. Go to **Deployments** tab
4. Find latest deployment
5. Click **...** menu → **Redeploy**
6. Click **Redeploy** to rebuild with new environment variable

---

## Troubleshooting During Deployment

### Frontend shows 404 error

**This is normal during setup.** It means the backend URL is not set yet.

1. Verify `VITE_API_URL` is in Vercel environment variables
2. Manual redeploy in Vercel (see above)
3. Wait 2-3 minutes
4. Hard refresh browser (Ctrl+Shift+R)
5. Check browser console (F12) for correct API URL

### Backend deployment fails

1. Check Railway/Heroku logs (in dashboard)
2. Verify `requirements.txt` exists in backend/
3. Verify `ANTHROPIC_API_KEY` is set (not empty)
4. Manually trigger redeploy

### CORS errors

1. Verify `ALLOWED_ORIGINS` includes your Vercel domain
2. Restart/redeploy backend
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh (Ctrl+Shift+R)

---

## What You Now Have ✅

| Component | What's Fixed |
|-----------|-------------|
| **Frontend API Config** | ✅ Only uses VITE_API_URL (no hardcoded URLs) |
| **Backend CORS** | ✅ Configured via environment variable |
| **Dependencies** | ✅ All listed in requirements.txt |
| **Error Handling** | ✅ Clear error messages for debugging |
| **Documentation** | ✅ Complete deployment guides included |
| **Git** | ✅ No secrets in repository |

---

## What to Do If Still Getting 404

Follow this exact checklist:

```
1. Backend running?
   curl https://your-railway-url/health
   → Should return 200 OK, not timeout or 404
   
2. VITE_API_URL set in Vercel?
   Vercel → Settings → Environment Variables
   → Should show VITE_API_URL=https://your-railway-url
   
3. Frontend redeployed after setting VITE_API_URL?
   Vercel → Deployments
   → Look for fresh deployment (within last 5 min)
   → If not, manually click Redeploy
   
4. Browser console shows correct URL?
   F12 Console
   → Should show: [Meesho Sakhi] API Base URL: https://your-railway-url
   → NOT localhost or Vercel domain
   
5. ALLOWED_ORIGINS includes Vercel domain?
   Railway → Variables
   → ALLOWED_ORIGINS should include https://your-vercel-domain.vercel.app
   
6. Backend redeployed after updating ALLOWED_ORIGINS?
   Railway → should show recent redeploy
   → If not, click Redeploy or push new commit
```

If all ✅ above, it should work!

---

## Final Reference

| Item | Value | Where |
|------|-------|-------|
| Backend URL | https://your-railway-url | Railway Dashboard |
| Frontend URL | https://your-vercel-url.vercel.app | Vercel Dashboard |
| ANTHROPIC_API_KEY | sk-ant-... | https://console.anthropic.com/ |
| VITE_API_URL | (Backend URL) | Vercel Environment Variables |
| ALLOWED_ORIGINS | (Frontend & Backend URLs) | Railway Environment Variables |

---

## You've Got This! 🚀

Your code is production-ready. All you need to do is:

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Set environment variables
4. ✅ Verify it works

**Estimated time: 1-2 hours (mostly waiting for deployments)**

Questions? Check:
- [QUICK_START.md](./QUICK_START.md) — 10-minute overview
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) — Complete guide
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) — Full reference

Good luck! 🎉
