# 🛍️ Meesho Sakhi — AI Shopping Companion

A multi-agent AI prototype built for intelligent shopping orchestration.  
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
| **Frontend** | React + Vite |
| **Backend** | Node.js (Express) + Prisma ORM + PostgreSQL |
| **AI** | Claude 3.5 Sonnet (Anthropic API) |
| **Streaming**| Server-Sent Events (SSE) |
| **Monorepo** | npm workspaces / root scripts |

## Setup

### Quickstart — Local Development

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (running locally or remote)
- Anthropic API key (get from https://console.anthropic.com/)

#### 1. Global Install & Build

From the root directory of the project, you can install and build everything at once:

```bash
# Install dependencies for both frontend and backend
npm run install:all

# Generate Prisma Client & Build Frontend (Optional for dev)
npm run build
```

#### 2. Backend Setup & Database

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your `.env` file (you can copy from a template if one exists, or create a new one):
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/meesho-sakhi?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   ALLOWED_ORIGINS="http://localhost:5173"
   PORT=8000
   ANTHROPIC_API_KEY="sk-ant-..." # Your Anthropic Key
   ```
3. Initialize the database and run seeds:
   ```bash
   # Push schema to your Postgres database
   npx prisma db push
   
   # Run the seed script to populate products/data (if applicable)
   npx prisma db seed
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   # Expected: Server running on http://localhost:8000
   ```

#### 3. Frontend Setup

In a new terminal:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Set up your `.env` file (if you are deploying, otherwise Vite proxy handles `localhost`):
   ```bash
   VITE_API_URL=http://localhost:8000
   ```
3. Start the development server:
   ```bash
   npm run dev
   # Expected: ➜  Local:   http://localhost:5173/
   ```

#### 4. Code Quality & Linting

You can run ESLint across the entire monorepo from the root:
```bash
# Lints both backend and frontend
npm run lint
```

## Production Deployment

**Quick Summary:**
- **Database:** Deploy PostgreSQL (e.g., Supabase, Neon, AWS RDS).
- **Backend:** Deploy to Render, Railway, or Heroku. 
  - Set `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, and `ANTHROPIC_API_KEY` environment variables.
  - Make sure the build command includes `npx prisma generate`.
- **Frontend:** Deploy to Vercel, Netlify, or Render. 
  - Set the `VITE_API_URL` environment variable to point to your live backend URL (no trailing slash).
- **CORS:** Ensure your backend's `ALLOWED_ORIGINS` includes your live frontend URL (e.g. `https://your-frontend.vercel.app`).

## Troubleshooting

### "Server error: 404" or API call fails
1. Ensure both the frontend and backend are running.
2. Check your browser console (F12) for CORS errors. If they exist, verify `ALLOWED_ORIGINS` in your backend `.env`.
3. If deployed, ensure `VITE_API_URL` is set to the correct backend domain and not your database URL.

### Anthropic API errors ("Rate limit", "Invalid API key")
1. Verify `ANTHROPIC_API_KEY` is correct in `backend/.env`.
2. Check you have quota/billing set up in your Anthropic Console.
3. Restart the backend after updating `.env` files.

## Demo Flow

1. Enter: *"Help me set up my hostel room in Mumbai, budget ₹12,000"*
2. Watch 8 agents fire live in the left panel.
3. Cart appears on the right with trust scores, savings tip, and category breakdown.

## Hackathon Talking Points

- **Not a chatbot** — a true agentic pipeline where each agent specializes.
- **Streaming** — users/judges can see reasoning happen in real-time.
- **Trust layer** — Review Trust Agent scores products on authenticity.
- **Budget-aware** — Selector Agent enforces per-category budgets strictly.
