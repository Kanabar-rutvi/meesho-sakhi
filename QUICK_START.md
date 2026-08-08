# 🚀 Quick Start — Meesho Sakhi Production Deployment

## In 10 Minutes: Local Setup

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env: Add ANTHROPIC_API_KEY from https://console.anthropic.com/
python -m uvicorn main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev
# Opens http://localhost:5173

# 3. Test
# Browser console should show: [Meesho Sakhi] API Base URL: http://localhost:8000
# Try asking Sakhi for shopping recommendations
```

---

## Production: Step-by-Step

### Step 1: Deploy Backend (Choose One)

#### Option A: Railway (Recommended - Easiest)
```bash
1. Go to https://railway.app/ → Sign up with GitHub
2. Create new project
3. Select your GitHub repo
4. Set root directory: backend/
5. In Settings → Environment Variables, add:
   ANTHROPIC_API_KEY=sk-ant-...  (from https://console.anthropic.com/)
   ALLOWED_ORIGINS=https://yourdomain.vercel.app
6. Wait for deployment
7. Copy your Railway URL: https://meesho-sakhi-xxx.railway.app
```

#### Option B: Heroku
```bash
# Create backend/Procfile:
web: gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT

# Then:
cd backend
pip install gunicorn
pip freeze > requirements.txt
heroku login
heroku create meesho-sakhi-backend
heroku config:set ANTHROPIC_API_KEY=sk-ant-...
heroku config:set ALLOWED_ORIGINS=https://yourdomain.vercel.app
git push heroku main
```

### Step 2: Deploy Frontend (Vercel)

```bash
1. Go to https://vercel.com/ → Sign up with GitHub
2. Click "Add New..." → "Project"
3. Select your GitHub repo
4. Configure:
   - Root Directory: frontend/
   - Build Command: npm run build
   - Output Directory: dist
5. BEFORE deployment, add Environment Variable:
   - Name: VITE_API_URL
   - Value: https://your-backend-url.railway.app  (NO trailing slash!)
6. Click "Deploy"
7. Wait for deployment
8. Get Vercel URL: https://yourdomain.vercel.app
```

### Step 3: Verify

```bash
# Test 1: Backend health
curl https://your-backend-url.railway.app/health
# Should return: {"status":"ok",...}

# Test 2: Frontend
Open https://yourdomain.vercel.app in browser
Press F12 → Console
Should see: [Meesho Sakhi] API Base URL: https://your-backend-url.railway.app
Try shopping → should work!
```

---

## Critical Variables Checklist

### Frontend (Vercel Environment Variables)
```bash
VITE_API_URL=https://your-backend-url.railway.app  ← NO trailing slash!
```

### Backend (Railway/Heroku Environment Variables)
```bash
ANTHROPIC_API_KEY=sk-ant-...                       ← From https://console.anthropic.com/
ALLOWED_ORIGINS=https://yourdomain.vercel.app     ← Your Vercel domain
PORT=8000                                          ← (Usually auto-provided)
ENV=production                                     ← For production
```

---

## Troubleshooting

### "Server error: 404" in Frontend

```bash
# Check 1: Is backend running?
curl https://your-backend-url/health

# Check 2: Is VITE_API_URL set correctly?
# Open browser F12 Console → should show:
# [Meesho Sakhi] API Base URL: https://your-backend-url

# Check 3: Did you redeploy after setting VITE_API_URL?
# In Vercel Dashboard → Deployments → Redeploy latest commit

# Check 4: Is ALLOWED_ORIGINS correct?
# In Railway/Heroku, check: ALLOWED_ORIGINS=https://yourdomain.vercel.app
```

### CORS Error

```bash
# Solution: Update backend environment variable
ALLOWED_ORIGINS=https://yourdomain.vercel.app,https://your-backend-url
# Then restart/redeploy backend
```

### API Key Error

```bash
# Check: Is ANTHROPIC_API_KEY set?
# In Railway/Heroku Environment Variables:
ANTHROPIC_API_KEY=sk-ant-v0-xxxxx...  ← Must be real, from console.anthropic.com
# Restart backend after changing
```

---

## Files Changed

| File | What Changed |
|------|-------------|
| `frontend/src/usePipeline.js` | ✅ Requires VITE_API_URL for production |
| `frontend/.env.example` | ✅ Added documentation |
| `backend/.env.example` | ✅ Added ANTHROPIC_API_KEY |
| `backend/requirements.txt` | ✅ Created with all dependencies |
| `backend/database.py` | ✅ Supports environment variable |
| `.gitignore` | ✅ Updated for production |
| `README.md` | ✅ Clearer instructions |
| `PRODUCTION_DEPLOYMENT.md` | ✅ Comprehensive guide |
| `DEPLOYMENT_SUMMARY.md` | ✅ Full reference |

---

## Architecture

```
https://yourdomain.vercel.app  (Vercel Frontend)
              ↓
         HTTPS API Call
              ↓
https://your-backend-url.railway.app  (FastAPI Backend)
              ↓
    Anthropic Claude API
    (8-agent orchestration)
```

---

## What NOT to Do

❌ Don't use `http://` for production (only HTTPS)
❌ Don't include trailing slash in VITE_API_URL: `https://url.com/`
❌ Don't commit `.env` file (use .env.example)
❌ Don't forget to redeploy after setting VITE_API_URL
❌ Don't hardcode backend URL in code (use environment variable)
❌ Don't use same domain for frontend & backend unless using reverse proxy

---

## Success Criteria ✅

- [ ] Backend deployed and `/health` returns 200
- [ ] Frontend deployed to Vercel
- [ ] Browser console shows correct API URL
- [ ] Can generate recommendations without 404 errors
- [ ] No CORS errors
- [ ] Anthropic API key is working

---

## Resources

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app/
- FastAPI Docs: https://fastapi.tiangolo.com/
- Anthropic Console: https://console.anthropic.com/

---

**Need more help?** See: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
