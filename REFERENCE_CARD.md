# 📌 PRODUCTION DEPLOYMENT — REFERENCE CARD

## The Problem You Had

```
User → Vercel Frontend (https://yourdomain.vercel.app)
       ↓ API Call
       ??? 404 Error
```

Frontend didn't know where the backend was deployed.

## The Solution We Implemented

```
Environment Variable:  VITE_API_URL
                            ↓
                    Injected at BUILD time
                            ↓
                      usePipeline.js
                            ↓
                    const getApiUrl() {
                      if (VITE_API_URL) return VITE_API_URL;
                      if (localhost) return "http://localhost:8000";
                      throw Error("Not configured");
                    }
                            ↓
                    API calls go to CORRECT backend
```

## Frontend Code Logic (usePipeline.js)

```javascript
// Priority Order:
// 1. If VITE_API_URL is set → USE IT (production)
if (VITE_API_URL) return VITE_API_URL;

// 2. If running on localhost → USE localhost:8000 (development)
if (hostname === "localhost") return "http://localhost:8000";

// 3. Otherwise → ERROR (prevent using wrong domain)
throw new Error("VITE_API_URL is not configured");
```

## Deployment Flow

```
git push
    ↓
GitHub
    ↓
Vercel ← (auto deploy)        Railway ← (auto deploy)
Frontend URL                  Backend URL
https://yourdomain.vercel.app https://backend-xxx.railway.app
    ↓                              ↑
    │ HTTPS API Call              │
    └──────────────────────────────┘

Browser Console Shows:
[Meesho Sakhi] API Base URL: https://backend-xxx.railway.app
```

## Environment Variables You Need

### Frontend (Vercel)
```
Name:  VITE_API_URL
Value: https://your-deployed-backend-url.com
       (NO trailing slash)
```

### Backend (Railway/Heroku)
```
Name:  ANTHROPIC_API_KEY
Value: sk-ant-v0-xxxxx...  (from console.anthropic.com)

Name:  ALLOWED_ORIGINS
Value: https://yourdomain.vercel.app

Name:  ENV
Value: production
```

## Quick Deployment Checklist

### ✅ Before Deployment
- [x] Frontend builds: `npm run build` succeeds
- [x] Backend imports: `python -c "import main"` works
- [x] Code pushed to GitHub
- [x] No .env files committed (only .env.example)

### ✅ During Backend Deployment
```
Railway/Heroku → Set Environment Variables:
  ANTHROPIC_API_KEY = sk-ant-...
  ALLOWED_ORIGINS = https://yourdomain.vercel.app
  
Deploy → Get Backend URL
  Example: https://meesho-sakhi-backend-xxx.railway.app
```

### ✅ During Frontend Deployment
```
Vercel → Set Environment Variable:
  VITE_API_URL = https://meesho-sakhi-backend-xxx.railway.app
  (Copy from backend deployment)
  
Deploy → Get Frontend URL
  Example: https://yourdomain.vercel.app
```

### ✅ After Both Deployments
```
1. Update Backend ALLOWED_ORIGINS:
   ALLOWED_ORIGINS = https://yourdomain.vercel.app
   Redeploy backend
   
2. Test Backend Health:
   curl https://backend-url/health
   
3. Test Frontend:
   Open https://yourdomain.vercel.app
   F12 Console → Check [Meesho Sakhi] API Base URL
   Try shopping → Should work
```

## Files Changed

| File | Change | Why |
|------|--------|-----|
| `frontend/src/usePipeline.js` | Require VITE_API_URL for prod | Prevent wrong domain fallback |
| `frontend/.env.example` | Add documentation | Explain env var usage |
| `backend/.env.example` | Add ANTHROPIC_API_KEY | Production API key required |
| `backend/requirements.txt` | Create with all deps | Ensure all packages are installed |
| `backend/database.py` | Support env DATABASE_URL | Flexible database configuration |
| `.gitignore` | Exclude node_modules | Don't commit dependencies |
| `README.md` | Update setup instructions | Clearer deployment process |

## Error Messages → What They Mean

| Error | Cause | Fix |
|-------|-------|-----|
| "Server error: 404" | Backend not found | Check VITE_API_URL is set correctly |
| "Backend API URL is not configured" | VITE_API_URL not set in production | Set in Vercel Environment Variables + rebuild |
| "Access to XMLHttpRequest blocked by CORS" | Frontend domain not in ALLOWED_ORIGINS | Add Vercel domain to backend ALLOWED_ORIGINS |
| "API Key error" | ANTHROPIC_API_KEY not set or invalid | Verify key in backend deployment |

## Console Messages (What to Look For)

```javascript
// ✅ GOOD - Local Development
[Meesho Sakhi] API Base URL: http://localhost:8000

// ✅ GOOD - Production
[Meesho Sakhi] API Base URL: https://your-backend-url.com

// ❌ BAD - Wrong domain (old code)
[Meesho Sakhi] API Base URL: https://yourdomain.vercel.app
// This would cause 404 errors!
```

## Local Development

```bash
# Terminal 1 - Backend
cd backend
export ANTHROPIC_API_KEY=sk-ant-...
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Test
curl http://localhost:8000/health
curl -X POST http://localhost:8000/shop \
  -H "Content-Type: application/json" \
  -d '{"query":"backpack"}'
```

## Production URLs

After deployment, you'll have:

```
Frontend: https://yourdomain.vercel.app
Backend:  https://backend-xxx.railway.app

Frontend calls Backend API:
https://yourdomain.vercel.app 
    ↓ (via VITE_API_URL)
    ↓ HTTPS POST /shop
https://backend-xxx.railway.app
```

## Critical Remember

❌ DON'T: Include trailing slash in VITE_API_URL
```
VITE_API_URL=https://url.com/  ← WRONG
VITE_API_URL=https://url.com   ← RIGHT
```

❌ DON'T: Set VITE_API_URL at runtime
```
// WRONG - Vite doesn't inject at runtime
window.VITE_API_URL = "...";

// RIGHT - Set before build
export VITE_API_URL=https://...
npm run build
```

❌ DON'T: Commit .env files
```
# Git repository should have:
✅ .env.example (with no secrets)
✅ .gitignore (ignoring .env)
❌ .env (never commit!)
```

✅ DO: Redeploy after changing VITE_API_URL
```
1. Set VITE_API_URL in Vercel Environment Variables
2. Must manually redeploy (or git push triggers it)
3. Vite injects env var at BUILD time only
```

## Test Commands

```bash
# Backend Health
curl https://your-backend-url/health

# Backend /shop Endpoint
curl -X POST https://your-backend-url/shop \
  -H "Content-Type: application/json" \
  -d '{"query":"shoes"}'

# Check CORS Headers
curl -i https://your-backend-url/health

# Frontend (Open in Browser)
https://your-frontend-url
Press F12 → Console → Look for [Meesho Sakhi] messages
```

## Deployment Platforms

| Platform | Backend | Frontend | Setup Time |
|----------|---------|----------|------------|
| Railway + Vercel | ✅ Easy | ✅ Easy | 1-2 hrs |
| Heroku + Vercel | ✅ Medium | ✅ Easy | 1-2 hrs |
| AWS + Vercel | ⚠️ Complex | ✅ Easy | 2-4 hrs |

## Recommended

**Easiest Setup:**
- Backend: Railway
- Frontend: Vercel
- Both have free tiers and auto-deploy from GitHub

**Total time: 1-2 hours**

---

## 📚 Full Documentation

Start here → [YOUR_NEXT_STEPS.md](./YOUR_NEXT_STEPS.md)
Then read → [QUICK_START.md](./QUICK_START.md)
Complete guide → [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
Full reference → [COMPLETE_SUMMARY.md](./COMPLETE_SUMMARY.md)

---

**You're ready to deploy!** 🚀
