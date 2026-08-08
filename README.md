# 🛍️ Meesho Sakhi — AI Hostel Shopping Agent

A working multi-agent AI prototype built for the hackathon demo.  
**Real Claude API calls. Real agent orchestration. Real-time streaming pipeline.**

## Architecture

```
User Query → [Goal Agent] → [Planner Agent] → per-category:
                                                 [Filter Agent]
                                                 [Ranker Agent]
                                                 [Selector Agent]
                           → [Review Trust Agent]
                           → [Recommendation Agent]
                           → [Checkout Agent]
                                               → Live Cart
```

Each of the 8 agents makes a **real Claude API call** with a strict JSON contract.  
Results stream live to the UI via Server-Sent Events (SSE).

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite (no framework bloat) |
| Backend | FastAPI (Python) |
| AI | Claude claude-sonnet-4-6 (Anthropic API) |
| Streaming | Server-Sent Events (SSE) |
| Catalog | 68 realistic Indian hostel products (JSON) |

## Setup

### Quickstart — Local Development

#### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Anthropic API key (get from https://console.anthropic.com/)

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Edit .env and add your API key:
# ANTHROPIC_API_URL=https://console.anthropic.com/
# ANTHROPIC_API_KEY=sk-ant-...  ← Your actual key here
# ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000

# Start the backend server
python -m uvicorn main:app --reload --port 8000

# Expected: INFO:     Uvicorn running on http://127.0.0.1:8000
```

#### 2. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server (Vite proxy handles API calls)
npm run dev

# Expected: ➜  Local:   http://localhost:5173/
```

#### 3. Verify Setup

1. Open http://localhost:5173 in your browser
2. Open Developer Console (F12) and check:
   - Should see: `[Meesho Sakhi] API Base URL: http://localhost:8000`
   - No CORS errors
3. Try the "Ask Sakhi" page and submit a query
4. Watch the 8-agent pipeline execute with live results

---

### Production Deployment

**For complete production deployment instructions, see: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)**

**Quick Summary:**
- **Frontend:** Deploy to Vercel, set `VITE_API_URL` environment variable
- **Backend:** Deploy separately to Railway/Heroku/AWS
- **CORS:** Configure `ALLOWED_ORIGINS` to include your Vercel domain
- **API Key:** Set `ANTHROPIC_API_KEY` in backend deployment

---

### Environment Variables

**Frontend (.env.local)** — Optional for local dev
```bash
# For local development: leave empty (defaults to localhost:8000)
# For production: set to deployed backend URL (NO trailing slash)
VITE_API_URL=

# Optional feature flags
VITE_ENABLE_VOICE_INPUT=true
VITE_ENABLE_REFINEMENT=true
```

**Backend (.env)** — REQUIRED
```bash
# Anthropic Claude API Key (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-...

# CORS allowed origins (separate by comma)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000

# Server configuration
HOST=0.0.0.0
PORT=8000
ENV=development
```

## Troubleshooting

### Local Development: "Server error: 404" or API call fails

**Step 1: Verify backend is running**
```bash
# In one terminal
cd backend && python -m uvicorn main:app --reload --port 8000

# In another terminal, test:
curl http://localhost:8000/health
# Should return: {"status":"ok",...}
```

**Step 2: Check browser console**
1. Open http://localhost:5173
2. Press F12 to open Developer Console
3. Look for: `[Meesho Sakhi] API Base URL: http://localhost:8000`
4. No CORS errors should appear

**Step 3: Test API endpoint directly**
```bash
curl -X POST http://localhost:8000/shop \
  -H "Content-Type: application/json" \
  -d '{"query":"show me a backpack"}'

# Should return Server-Sent Events stream, not 404
```

**Step 4: Check ANTHROPIC_API_KEY**
```bash
# In backend/.env, verify you have:
ANTHROPIC_API_KEY=sk-ant-...  # Not empty!
# Restart backend after changing
```

### Production Deployment: "Server error: 404"

This means frontend can't reach the backend. **See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed troubleshooting.**

**Quick checklist:**
- [ ] Backend is deployed and running: `curl https://your-backend-url/health`
- [ ] `VITE_API_URL` is set in Vercel Environment Variables
- [ ] Vercel frontend is redeployed after setting `VITE_API_URL`
- [ ] Browser shows correct API URL in console: `[Meesho Sakhi] API Base URL: https://...`
- [ ] Backend `ALLOWED_ORIGINS` includes your Vercel domain
- [ ] ANTHROPIC_API_KEY is set in backend deployment

### CORS Errors ("Access to XMLHttpRequest blocked by CORS policy")

**Solution:**
1. Go to your backend deployment
2. Ensure `ALLOWED_ORIGINS` includes your frontend domain
3. Example: `ALLOWED_ORIGINS=https://yourdomain.vercel.app,https://your-backend-url`
4. Restart/redeploy backend

### Mobile phone shows errors or broken layout

1. **For broken layout:** Already fixed with responsive CSS
2. **For API errors after deployment:** Same as above, check VITE_API_URL

### Anthropic API errors ("Rate limit", "Invalid API key", etc.)

1. Verify ANTHROPIC_API_KEY is correct: https://console.anthropic.com/
2. Check you have quota/billing set up
3. Monitor API usage at https://console.anthropic.com/
4. Check backend logs for exact error message

## Demo Flow

1. Enter: *"Help me set up my hostel room in Mumbai, budget ₹12,000"*
2. Watch 8 agents fire live in the left panel
3. Cart appears on the right with trust scores, savings tip, and category breakdown

## Hackathon Talking Points

- **Not a chatbot** — a true agentic pipeline where each agent specializes
- **Streaming** — judges can see reasoning happen in real time
- **Trust layer** — Review Trust Agent scores products on authenticity
- **Budget-aware** — Selector Agent enforces per-category budgets strictly
- **Extensible** — swap the JSON catalog for real Meesho API when available
