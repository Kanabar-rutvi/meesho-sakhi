# Meesho Sakhi — Vercel Deployment Checklist

## Architecture

```
Meesho Sakhi on Vercel:
┌─────────────────────────────────────────────────────────┐
│                   Vercel Deployment                      │
│                                                           │
│  Static Frontend (React/Vite)                             │
│  └─ /assets/*  →  frontend/dist/  (served statically)     │
│                                                           │
│  Serverless API (Node.js + Express + Prisma)              │
│  └─ /api/*     →  api/_meesho.js  (serverless function)   │
│      └─ internally rewrites to /shop, /auth, etc.         │
│         using @vendia/serverless-express                  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Pre-Deploy Checklist (Do These First)

### 1. Database — PostgreSQL Required

SQLite does **not** persist on Vercel (serverless functions have ephemeral storage).
Use one of:

| Provider | Free Tier | Notes |
|---|---|---|
| **Supabase** | ✅ Yes | Already configured in your `.env` |
| **Neon** | ✅ Yes | Serverless Postgres, great for Vercel |
| **Vercel Postgres** | ✅ Yes | Native integration via Vercel Storage |

**If using Supabase (already in `.env`):**

- Confirm the connection string in `backend/.env`:
  ```
  DATABASE_URL=postgresql://postgres:...@db....supabase.co:5432/postgres
  ```
- Open Supabase → SQL Editor → run `SELECT 1;` to confirm it's reachable from public IPs.
- In Supabase **Connection Pooling** settings, copy the pooled URL (port `6543`) for production if you expect high traffic.

### 2. Run Prisma Migrations Against the Production DB

Before deploying, run migrations from your local machine to create tables:

```powershell
# From the meesho-sakhi/ folder
cd backend
npx prisma migrate deploy
#  OR if no migration files yet, do:
npx prisma db push
```

Then verify tables exist:
```powershell
npx prisma studio    # opens GUI to browse DB
```

### 3. Confirm File Structure

Your `meesho-sakhi/` folder should contain these files (created above):

```
meesho-sakhi/
├── package.json          ← Root (install:all + build scripts)
├── vercel.json           ← Rewrites + functions config
├── api/
│   └── _meesho.js        ← Serverless entry (Express adapter)
├── backend/
│   ├── package.json      ← +@vendia/serverless-express
│   ├── prisma/schema.prisma  ← provider = "postgresql"
│   └── src/
│       ├── app.js        ← Express app (export default)
│       └── index.js      ← ONLY calls app.listen()
└── frontend/
    └── package.json
```

---

## 🚀 Deploy to Vercel (3 Methods)

### Method A — Vercel CLI (Recommended for first deploy)

```powershell
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login (opens browser)
vercel login

# 3. From the meesho-sakhi/ directory:
cd C:\Users\Admin\Downloads\meesho-sakhi-prototype\meesho-sakhi

# 4. Initial setup — answer prompts:
vercel
#  ✔ Set up and deploy? → Y
#  ✔ Which scope? → (your account)
#  ✔ Link to existing project? → N
#  ✔ Project name: meesho-sakhi
#  ✔ In which directory is your code located? → ./   (JUST PRESS ENTER, this is CRITICAL)
#  ✔ Want to modify these settings? → N

# 5. After first build succeeds, add all env vars (see section below)

# 6. Redeploy with env vars applied
vercel --prod
```

### Method B — Import via Vercel Dashboard

1. Go to https://vercel.com/new
2. Select your Git repo (push project to GitHub first)
3. **Root Directory**: enter `meesho-sakhi` (not `/`)
4. Framework Preset: *Other* (Vite detection may be wrong for monorepo)
5. Build Command: `npm run build`
6. Output Directory: `frontend/dist`
7. Install Command: `npm run install:all`
8. Click **Deploy**
9. After it fails (missing env vars), go to Project → Settings → Environment Variables and add them (section below), then **Redeploy**.

### Method C — Push & Auto-Deploy

Push your code to the `main` branch of a GitHub/GitLab/Bitbucket repo,
import the project in Vercel Dashboard, set root dir to `meesho-sakhi/`,
and every subsequent `git push` will auto-deploy.

---

## 🔐 Environment Variables (ALL of these must be set in Vercel)

In Vercel Dashboard → Project → **Settings → Environment Variables**:

| Variable Name | Value | Scope | Example / Notes |
|---|---|---|---|
| `DATABASE_URL` | Postgres connection string | Production + Preview + Development | `postgresql://user:pass@host:5432/db` (use Supabase/Neon/Vercel Postgres pooled URL) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Production + Preview + Development | `sk-ant-...` (pipeline degrades gracefully if missing but product quality drops) |
| `JWT_SECRET` | Long random string | Production + Preview + Development | `openssl rand -hex 32` output. MUST be the same between deployments or users get logged out. |
| `ALLOWED_ORIGINS` | Your Vercel URL(s) | Production + Preview + Development | `https://meesho-sakhi.vercel.app,https://*.vercel.app,http://localhost:5173` |
| `VITE_API_URL` | `/api` | Production + Preview + Development | **IMPORTANT**: Must be exactly `/api` so frontend calls `/api/shop`, `/api/auth` etc. |

**Setting via Vercel CLI:**

```powershell
# Set one by one (scope = production,preview,development)
vercel env add DATABASE_URL production
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development

vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_API_KEY development

vercel env add JWT_SECRET production
# ... and so on for all variables above
```

---

## 🧪 Post-Deploy Smoke Tests

Once the first production deploy finishes, run these checks from your browser:

### 1. API Health
```
https://<your-project>.vercel.app/api/health
```
Expected: JSON with `status: "ok"` and features list.

### 2. API Root
```
https://<your-project>.vercel.app/api/
```
Expected: `{name: "Meesho Sakhi API (Node.js)", status: "running"}`.

### 3. Frontend Load
```
https://<your-project>.vercel.app/
```
Expected: Landing page loads, no console errors.

### 4. Sign Up Flow
- Go to `/auth`
- Create an account
- Confirm JWT token is stored (DevTools → Application → Local Storage)

### 5. Ask Sakhi Pipeline
- Go to `/ask-sakhi`
- Type a query: "I need a casual summer outfit under ₹2000"
- Click **Generate Plan**
- Watch SSE streaming: agent steps should populate, cart items should appear progressively with skeletons.

### 6. Preference Engine (Learned Preferences)
- Click 👍 / 👎 on a product
- Refresh, run the query again → results should shift based on feedback.

---

## 🔧 Troubleshooting Common Errors

### `Error: @prisma/client did not initialize yet`
**Cause**: Prisma generate was not run before build, or schema.prisma isn't bundled with the serverless function.
**Fix**:
- In `vercel.json`, confirm:
  ```json
  "functions": {
    "api/_meesho.js": {
      "includeFiles": "backend/prisma/schema.prisma"
    }
  }
  ```
- Root `package.json` build script runs `prisma generate` inside backend:
  ```
  "build:backend": "npm install --prefix backend && npx --prefix backend prisma generate"
  ```

### `504: FUNCTION_INVOCATION_TIMEOUT` on Ask Sakhi
**Cause**: 8-agent pipeline + Claude calls exceed default 10s limit.
**Fix**: Already set in `api/_meesho.js` → `config.maxDuration = 60`. If still hitting, consider:
- Reduce agents count
- Add streaming chunking to respond faster to Vercel's idle detection

### `404: NOT_FOUND` on `/api/shop`
**Cause**: Rewrite rule missing or wrong source order in vercel.json.
**Fix**: In `vercel.json` rewrites array, `/api/(.*)` MUST appear **BEFORE** `/(.*)` → `/index.html`.

### CORS Error in Browser Console
**Cause**: `ALLOWED_ORIGINS` does not include your Vercel domain or includes a trailing `/`.
**Fix**:
- Set in Vercel env:
  ```
  ALLOWED_ORIGINS=https://meesho-sakhi.vercel.app,http://localhost:5173
  ```
  (No trailing slashes, comma-separated.)
- Trigger a redeploy (env vars need a new build to apply.)

### Frontend can't reach backend, API calls to `/shop` 404
**Cause**: `VITE_API_URL` not set or not `/api` during build.
**Fix**:
```
VITE_API_URL=/api
```
Env vars prefixed `VITE_` are baked in at **build time**. You must redeploy after changing them.

### Prisma DB Connection Errors (Postgres)
**Cause**: IP whitelist or SSL mode issue with Supabase/Vercel Postgres.
**Fix for Supabase**:
- Go to Supabase Project → Settings → Database → IP Allowlist → add `0.0.0.0/0` (Vercel uses dynamic IPs) or use Supabase IPv4 enable.
- Connection params: add `?pgbouncer=true&pool_timeout=30&connect_timeout=30` for pooled URL

---

## 📦 Optional: Domain + Custom URL

1. In Vercel Project → **Settings → Domains**
2. Add `shop-sakhi.yourdomain.com`
3. Follow DNS instructions (CNAME to `cname.vercel-dns.com`)
4. Update `ALLOWED_ORIGINS` env var to include your custom domain
5. Redeploy

---

## 🗒️ Quick Command Reference

```powershell
# Local dev (after DB migrations applied):
cd backend ; npx prisma generate ; npm start
cd frontend ; npm run dev

# Deploy:
cd meesho-sakhi
vercel --prod

# View recent deployments:
vercel ls

# Stream logs for the current production deployment:
vercel logs --prod

# Open production URL:
vercel --prod && vercel open --prod
```
