# Production Deployment Guide — Meesho Sakhi

This guide covers deploying Meesho Sakhi to production with:
- **Frontend:** Vercel (React + Vite)
- **Backend:** Separate deployment (FastAPI + Uvicorn)

---

## Architecture Overview

```
User Browser (HTTPS)
      ↓
Vercel (Frontend)
https://yourdomain.vercel.app
      ↓
FastAPI Backend (Separate Server)
https://your-backend-domain.com
      ↓
Database + Anthropic Claude API
```

**Key Point:** Frontend and Backend are deployed SEPARATELY. The frontend must know how to reach the backend via `VITE_API_URL`.

---

## Part 1: Local Testing (Before Deployment)

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
python -m pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env

# Edit .env:
# - Set ANTHROPIC_API_KEY to your actual API key
# - Set ALLOWED_ORIGINS for local testing:
#   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000
```

**Frontend (.env.local) — Optional for Local Dev:**
```bash
cd frontend
# For local dev, no .env needed (defaults to localhost:8000)
# You can create .env.local if you want to test with a specific backend:
# echo "VITE_API_URL=http://localhost:8000" > .env.local
```

### Step 3: Run Backend Locally

```bash
cd backend

# Start development server:
python -m uvicorn main:app --reload --port 8000

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Step 4: Run Frontend Locally

```bash
cd frontend

# In a new terminal:
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### Step 5: Test Locally

1. Open http://localhost:5173 in browser
2. Open Developer Console (F12)
3. Look for: `[Meesho Sakhi] API Base URL: http://localhost:8000`
4. Try generating recommendations
5. Should work without errors

---

## Part 2: Deploy Backend

### Hosting Options

**Option A: Railway** (Recommended for easy deployment)
- Supports Python + Uvicorn
- Free tier available
- Automatic environment variable management

**Option B: Heroku**
- Free tier ended, but still popular
- Requires Procfile

**Option C: AWS (EC2, ECS, Lambda)**
- More complex setup
- Full control

**Option D: DigitalOcean, Linode, or Similar**
- Simple VPS deployment

### Deploy to Railway (Recommended)

#### Step 1: Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub
3. Create new project

#### Step 2: Connect GitHub Repository
1. Click "Deploy from GitHub"
2. Select your repository
3. Select branch: `main` (or your branch)

#### Step 3: Configure Service
1. Railway detects Python automatically
2. Set root directory: `backend/` (if not already set)
3. Click "Deploy"

#### Step 4: Set Environment Variables in Railway
1. Go to Project Settings
2. Add Environment Variable:
   ```
   ANTHROPIC_API_KEY = your_actual_api_key_here
   ALLOWED_ORIGINS = https://yourdomain.vercel.app
   PORT = 8000  # Railway provides this, but confirm
   ```
3. Save & redeploy

#### Step 5: Get Backend URL
1. Railway gives you a public URL
2. Example: `https://meesho-sakhi-backend-production.up.railway.app`
3. Test: Open https://your-railway-url/health
4. Should return: `{"status":"ok",...}`

### Deploy to Heroku

#### Step 1: Create Procfile
Create `backend/Procfile`:
```
web: gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

#### Step 2: Install Gunicorn
```bash
cd backend
pip install gunicorn
pip freeze > requirements.txt  # Update requirements
```

#### Step 3: Deploy
```bash
cd backend
heroku login
heroku create meesho-sakhi-backend
git push heroku main
```

#### Step 4: Set Environment Variables
```bash
heroku config:set ANTHROPIC_API_KEY=your_key_here
heroku config:set ALLOWED_ORIGINS=https://yourdomain.vercel.app
heroku config:set ENV=production
```

#### Step 5: Get Backend URL
```bash
heroku open  # Opens your app URL
# Example: https://meesho-sakhi-backend.herokuapp.com
```

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Build Frontend Locally
```bash
cd frontend

# Build with local backend URL (for testing):
npm run build

# This creates frontend/dist/ folder with optimized build
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Production build ready"
git push origin main
```

### Step 3: Connect Vercel to GitHub
1. Go to https://vercel.com
2. Sign up / Log in
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 4: Set Environment Variables in Vercel
1. Before deployment, add environment variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url` (from Railway/Heroku step)
   - **Example:** `https://meesho-sakhi-backend-production.up.railway.app`
   - **IMPORTANT:** No trailing slash!

2. Click "Save"

### Step 5: Deploy
1. Vercel auto-deploys when you push to GitHub
2. Or click "Deploy" in Vercel dashboard
3. Wait for deployment to complete
4. Get your frontend URL: `https://yourdomain.vercel.app`

### Step 6: Verify Deployment
1. Open your Vercel URL in browser
2. Open Developer Console (F12)
3. Look for: `[Meesho Sakhi] API Base URL: https://your-backend-url`
4. Try generating recommendations
5. Check Network tab → look for `/shop` request
6. Should call `https://your-backend-url/shop`

---

## Part 4: Configure CORS

If you get CORS errors in browser:

### Update Backend ALLOWED_ORIGINS
1. Go to your backend deployment (Railway/Heroku)
2. Update environment variable:
   ```
   ALLOWED_ORIGINS=https://yourdomain.vercel.app,https://your-backend-url
   ```
3. Redeploy

Example:
```
ALLOWED_ORIGINS=https://meesho-sakhi.vercel.app,https://meesho-sakhi-backend-production.up.railway.app
```

---

## Part 5: Verify Everything Works

### Test API Health
```bash
# Test from browser or curl:
curl https://your-backend-url/health

# Should return:
# {"status":"ok","version":"2.0.0",...}
```

### Test /shop Endpoint
```bash
curl -X POST https://your-backend-url/shop \
  -H "Content-Type: application/json" \
  -d '{"query":"show me affordable shoes"}'

# Should return Server-Sent Events stream
# Should NOT return 404
```

### Test Frontend
1. Open https://yourdomain.vercel.app
2. Open F12 Console
3. Verify: `[Meesho Sakhi] API Base URL: https://your-backend-url`
4. Try shopping → should work without 404 errors

---

## Troubleshooting

### Problem: "Server error: 404" in frontend

**Check 1: Is backend running?**
```bash
curl https://your-backend-url/health
# Should return 200 OK, not 404 or timeout
```

**Check 2: Is VITE_API_URL set correctly?**
1. Open browser F12 Console
2. Look for: `[Meesho Sakhi] API Base URL: `
3. The URL should match where your backend is deployed
4. No trailing slash!

**Check 3: Is frontend rebuilt with new VITE_API_URL?**
```bash
# In Vercel:
1. Go to Settings → Environment Variables
2. Verify VITE_API_URL is set
3. Go to Deployments
4. Click "..." → "Redeploy" to rebuild with new env var
```

**Check 4: Is ALLOWED_ORIGINS configured?**
1. Go to backend deployment
2. Check ALLOWED_ORIGINS includes your Vercel domain
3. Example: `ALLOWED_ORIGINS=https://meesho-sakhi.vercel.app`
4. Redeploy backend

### Problem: CORS Error

**Solution:**
1. Check browser Console for: `Access to XMLHttpRequest blocked by CORS policy`
2. Verify backend `ALLOWED_ORIGINS` includes frontend domain
3. Restart backend

### Problem: Anthropic API Errors

**Solution:**
1. Verify ANTHROPIC_API_KEY is set in backend environment
2. Verify key is valid (get from https://console.anthropic.com/)
3. Check backend logs for error details
4. Restart backend after changing key

---

## Environment Variable Checklist

### Frontend (Vercel Environment Variables)
- [ ] `VITE_API_URL` = `https://your-backend-url` (no trailing slash)
- [ ] After setting, redeploy in Vercel
- [ ] Verify in browser console: `[Meesho Sakhi] API Base URL: ...`

### Backend (Railway/Heroku Environment Variables)
- [ ] `ANTHROPIC_API_KEY` = your actual API key
- [ ] `ALLOWED_ORIGINS` = your Vercel domain (e.g., `https://yourdomain.vercel.app`)
- [ ] `ENV` = `production`
- [ ] `DATABASE_URL` = connection string (if not using default SQLite)

---

## Redeploy After Changes

### After Changing Frontend Code
```bash
cd frontend
git add .
git commit -m "Update frontend"
git push

# Vercel auto-redeploys via GitHub integration
# Or manually redeploy in Vercel dashboard
```

### After Changing Backend Code
```bash
cd backend
git add .
git commit -m "Update backend"
git push

# Railway/Heroku auto-redeploys via GitHub integration
# Monitor deployment in Railway/Heroku dashboard
```

### After Changing VITE_API_URL in Vercel
1. Update in Vercel Environment Variables
2. **MUST redeploy** by clicking "Deploy" or "Redeploy"
3. Vite injects environment variables at BUILD time
4. Simply restarting won't work — must rebuild

---

## Production Best Practices

1. **Always use HTTPS** — Never use HTTP in production
2. **Secure API Keys** — Use environment variables, never commit .env
3. **CORS Whitelist** — Only allow known frontend domains
4. **Database Backups** — If using SQLite, backing it up is your responsibility
5. **Monitoring** — Set up error logging to catch production issues
6. **ANTHROPIC_API_KEY** — Keep it secret, rotate if compromised
7. **Database Migration** — Consider PostgreSQL instead of SQLite for production
8. **Logs** — Check backend logs regularly for errors

---

## Next Steps

1. ✅ Local testing complete
2. ✅ Backend deployed (Railway/Heroku)
3. ✅ Frontend deployed (Vercel)
4. ✅ CORS configured
5. ✅ VITE_API_URL set
6. 🚀 Production is live!

---

## Support

If you encounter issues:

1. **Check browser console** (F12) for error messages
2. **Check backend logs** in Railway/Heroku dashboard
3. **Verify environment variables** are set correctly
4. **Test backend directly** with curl commands
5. **Review CORS configuration** if API calls are blocked
6. **Ensure ANTHROPIC_API_KEY is valid** (test with backend `/docs`)

Good luck! 🚀
