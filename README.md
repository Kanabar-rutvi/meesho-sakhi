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
<!-- 
## Setup

### 1. Backend
```bash
cd backend
pip install fastapi uvicorn anthropic python-dotenv

# Add your API key:
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Run:
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev   # opens at http://localhost:5173
```

The Vite dev server proxies `/shop` → `http://localhost:8000` automatically.

## Demo Flow

1. Enter: *"Help me set up my hostel room in Mumbai, budget ₹12,000"*
2. Watch 8 agents fire live in the left panel
3. Cart appears on the right with trust scores, savings tip, and category breakdown

## Hackathon Talking Points

- **Not a chatbot** — a true agentic pipeline where each agent specializes
- **Streaming** — judges can see reasoning happen in real time
- **Trust layer** — Review Trust Agent scores products on authenticity
- **Budget-aware** — Selector Agent enforces per-category budgets strictly
- **Extensible** — swap the JSON catalog for real Meesho API when available -->
