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

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env

# Add your Anthropic API key to .env
# ANTHROPIC_API_KEY=sk-ant-...

# Run the server
uvicorn main:app --reload --port 8000
```

**Important:** Make sure the backend is running on `http://localhost:8000` before starting the frontend.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file (copy from .env.example)
cp .env.example .env.local

# For local development, leave VITE_API_URL empty (uses Vite proxy)
# For production, set VITE_API_URL=https://your-api-domain.com

# Start development server
npm run dev   # opens at http://localhost:5173
```

### 3. Verify Setup

- Open http://localhost:5173 in your browser
- Check that the backend is running: `curl http://localhost:8000/health`
- Try the "Ask Sakhi" page and submit a query
- You should see agent pipeline status and results

## Troubleshooting

### "Server error: 404" when generating recommendations

**Local Development:**
1. Make sure backend is running: `cd backend && uvicorn main:app --reload --port 8000`
2. Check if `/shop` endpoint is accessible: `curl -X POST http://localhost:8000/shop -H "Content-Type: application/json" -d '{"query":"test"}'`
3. Check browser console for CORS errors
4. Make sure `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL

**After Deployment:**
1. Set `VITE_API_URL` to your deployed backend URL: `https://your-api.example.com`
2. Rebuild frontend: `npm run build`
3. Ensure backend is running at the correct URL
4. Check that CORS is properly configured in backend `.env`:
   ```
   ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-api-domain.com
   ```

### Mobile phone shows errors

- Make sure both frontend and backend support CORS
- On deployed server, configure CORS headers properly
- Check that API URL is correct for your deployment environment
- Clear browser cache and hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

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
