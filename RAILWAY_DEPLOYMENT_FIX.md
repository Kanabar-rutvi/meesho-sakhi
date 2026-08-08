# 🚂 Railway Deployment Fix Guide

## ✅ What's Fixed

Your Railway deployment now has:
1. ✅ Proper `Dockerfile` for building the application
2. ✅ `.dockerignore` to exclude unnecessary files
3. ✅ `railway.json` configuration (no broken env var references)
4. ✅ Correct `Procfile` for startup

---

## 🔴 Error You Got

```
Build Failed: build daemon returned an error 
< failed to solve: secret ID missing for "" environment variable >
```

### Root Cause
Railway's buildpack was trying to reference an empty or malformed environment variable during build.

### Solution
We're now using a **Dockerfile** (explicit build instructions) instead of relying on Railway's automatic detection.

---

## 🚀 Deploy to Railway (Complete Steps)

### Step 1: Push Code to GitHub

```bash
cd c:\Users\Admin\Downloads\meesho-sakhi-prototype\meesho-sakhi

# Stage all changes
git add .

# Commit
git commit -m "Fix: Add proper Railway deployment configuration"

# Push
git push origin main
```

---

### Step 2: Connect to Railway

1. Go to **https://railway.app/**
2. Sign in (or create account)
3. Click **"New Project"**
4. Select **"Deploy from GitHub"**
5. Search for your repository: `meesho-sakhi`
6. Click **"Import"**
7. Select **only the `backend` directory**:
   - In Railway dashboard, go to **Settings**
   - Under **"Deployment"**, set **Root Directory**: `backend`

---

### Step 3: Configure Environment Variables

In Railway dashboard, go to **Variables** section and add:

#### ✅ Required Variables

1. **ANTHROPIC_API_KEY**
   - Get from: https://console.anthropic.com/
   - Click **"Create Secret"** when adding
   - Example: `sk-ant-d01a...`
   - ⭐ CRITICAL: This is required for the app to work

2. **ALLOWED_ORIGINS**
   - Your frontend domain(s) (comma-separated)
   - For now, you can use a placeholder: `http://localhost:5173`
   - We'll update this after deploying frontend to Vercel
   - Examples:
     ```
     http://localhost:5173
     https://yourdomain.vercel.app,https://yourdomain.vercel.app
     ```

#### ✅ Optional Variables

3. **DATABASE_URL** (if using PostgreSQL)
   - For SQLite (default): Leave empty, Railway will use the file
   - For PostgreSQL: Set to your database URL
   - Railway auto-provides PostgreSQL if you add it as a resource

4. **ENV**
   - Set to: `production`

---

### Step 4: Deploy

1. In Railway dashboard, click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Once deployed, you'll see a **URL** like:
   ```
   https://meesho-sakhi-backend-production.up.railway.app
   ```
4. Click it to verify (should show):
   ```json
   {
     "status": "ok",
     "service": "Meesho Sakhi API",
     "version": "2.0.0"
   }
   ```

---

## 🔍 Troubleshooting

### If deployment fails again:

#### Check Logs
1. In Railway dashboard, click **"Logs"**
2. Look for error messages
3. Common issues:

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | Dependencies not installed. Check `requirements.txt` is in backend folder |
| `ANTHROPIC_API_KEY` error | Add ANTHROPIC_API_KEY to Variables |
| `Connection refused` | Port issue. Make sure Dockerfile uses `$PORT` |
| `403 Forbidden (CORS)` | ALLOWED_ORIGINS doesn't include frontend domain |

#### Rebuild
If you make changes:
1. Push to GitHub: `git push origin main`
2. Railway auto-rebuilds (or click "Redeploy" button)

---

## 📋 Verify It Works

### Local Test First (Recommended)

```bash
# Terminal 1: Backend
cd backend
python -m pip install -r requirements.txt
export ANTHROPIC_API_KEY=your_key_here
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2: Test endpoint
curl http://localhost:8000/
# Should return: {"status": "ok", ...}
```

### After Railway Deploy

```bash
# Replace with your actual Railway URL
curl https://your-backend.up.railway.app/

# Should return: {"status": "ok", ...}
```

---

## 🔄 Next: Frontend Deployment

After backend is deployed and working:

1. Copy the backend URL (e.g., `https://your-backend.up.railway.app`)
2. Go to Vercel
3. Deploy frontend with `VITE_API_URL=https://your-backend.up.railway.app`
4. Update backend `ALLOWED_ORIGINS` with Vercel URL

---

## 📞 Common Issues & Fixes

### "Build Failed: Secret ID missing"
✅ **Fixed by:** Using Dockerfile instead of buildpack
- The Dockerfile is now in place
- Just re-deploy from Railway dashboard

### "Port already in use"
✅ **Fixed by:** Dockerfile uses `$PORT` environment variable
- Railway automatically sets this
- No manual configuration needed

### "CORS error in browser"
✅ **Fix:** Update `ALLOWED_ORIGINS` with frontend domain
1. Go to Railway Variables
2. Update ALLOWED_ORIGINS
3. Redeploy backend

### "ANTHROPIC_API_KEY not found"
✅ **Fix:** Add it to Railway Variables
1. Go to Railway Variables
2. Add ANTHROPIC_API_KEY
3. Redeploy

---

## ✅ Files Added/Updated

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Multi-stage build for production |
| `backend/.dockerignore` | Files to exclude from Docker image |
| `backend/railway.json` | Railway configuration (no broken refs) |
| `backend/Procfile` | Already correct |

---

## 🚀 Quick Checklist

- [ ] Push code to GitHub
- [ ] Connect repository to Railway
- [ ] Set root directory to `backend`
- [ ] Add `ANTHROPIC_API_KEY` variable
- [ ] Add `ALLOWED_ORIGINS` variable
- [ ] Deploy
- [ ] Test `/` endpoint
- [ ] Note backend URL
- [ ] Deploy frontend with `VITE_API_URL`
- [ ] Update `ALLOWED_ORIGINS` with frontend URL
- [ ] Redeploy backend
- [ ] Test end-to-end

---

## 📚 Files to Reference

- **Main setup:** `YOUR_NEXT_STEPS.md`
- **Full guide:** `PRODUCTION_DEPLOYMENT.md`
- **Quick ref:** `REFERENCE_CARD.md`

---

## 💡 Key Takeaway

**The error was caused by:** Railway's buildpack trying to use broken environment variable references.

**The fix:** Using an explicit `Dockerfile` (which we provide) instead of auto-detection.

**What you do:** Connect repo to Railway, add environment variables, deploy. That's it!

✅ **Status:** You're ready to deploy!
