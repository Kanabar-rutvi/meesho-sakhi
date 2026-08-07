# Meesho Sakhi - Product Requirements Document (PRD) & Roadmap

## 1. Product Overview
**Meesho Sakhi** is an Autonomous AI Shopping Companion designed for the "Bharat" demographic (Tier 2/3+ cities in India). Instead of making users manually search, filter, and compare thousands of products, Sakhi acts as a personal shopper. The user simply states a goal (e.g., "Help me set up my hostel room for ₹15,000"), and a pipeline of specialized AI agents works together to curate an optimized, trust-verified shopping cart.

## 2. System Architecture
The application follows a modern, decoupled client-server architecture:

### Frontend (Client-side)
*   **Tech Stack:** React, Vite, Vanilla CSS (Premium Custom Design System).
*   **Core Concepts:**
    *   **SSE (Server-Sent Events) Consumer:** Listens to real-time streams from the backend to visualize the AI agents' thought processes.
    *   **i18n Context:** Multi-language support (English/Hindi) built-in.
    *   **Theme Context:** Dynamic Light/Dark mode with premium glassmorphism and animated mesh gradients.
    *   **Pipeline UI:** A sidebar visualizing the live status of each AI agent (Goal -> Planner -> Filter...).

### Backend (Server-side)
*   **Tech Stack:** Python, FastAPI, Uvicorn, Anthropic Claude API (with dynamic fallbacks).
*   **Architecture:** Event-Driven Multi-Agent Pipeline.
*   **Agent Workflow:**
    1.  **Goal Agent:** Parses natural language, extracts budget (handling formats like ₹15,000 or 15k), and weights shopping categories based on intent (e.g., "kitchen", "student", "bachelor").
    2.  **Planner Agent:** Breaks the goal down into per-category budgets and defines "must-haves" vs "nice-to-haves".
    3.  **Filter Agent:** Queries the mock catalog (`catalog.json`) to find items matching the category and price constraints.
    4.  **Ranker Agent:** Scores items based on ratings, review counts, and semantic keyword matching (e.g., boosting "durable", "hostel").
    5.  **Selector Agent:** Greedily selects the highest-ranked items until the category budget is exhausted.
    6.  **Review Trust Agent:** Calculates a "Trust Score" (0-100%) for items to ensure the user doesn't buy low-quality goods.
    7.  **Recommendation & Checkout Agents:** Assembles the final cart, calculates savings, and outputs a structured summary.

---

## 3. Current Feature Set (What we have built)

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Multi-Agent AI Pipeline** | 7 distinct AI agents working autonomously to build a cart. | ✅ Completed |
| **Dynamic Budget & Intent Parsing** | Understands complex budgets and infers product categories based on text (e.g. "cooking" -> Kitchen). | ✅ Completed |
| **Real-time Pipeline UI** | Users see exactly what the AI is doing in real-time, building trust. | ✅ Completed |
| **Trust Scores** | Evaluates product quality based on rating-to-review ratios to protect users. | ✅ Completed |
| **Premium Aesthetic UI** | Glassmorphism, mesh gradients, dark/light modes, micro-animations. | ✅ Completed |
| **Bilingual Interface** | English and Hindi toggle (i18n). | ✅ Completed |
| **Explainable AI** | "Why Sakhi picked this" reasoning provided for every single product in the cart. | ✅ Completed |

---

## 4. Competitive Analysis: Do we have enough to stand out?

While the current multi-agent text-based shopping experience is **highly innovative** and much better than traditional e-commerce search, **it is not quite enough to become a viral, standout product for the target "Bharat" demographic.**

### Why?
1.  **Typing Fatigue:** Users in Tier 2/3 cities often prefer speaking over typing long, complex prompts.
2.  **Visual Discovery:** Shopping is highly visual. Describing a room vibe in text is hard; showing a picture is easy.
3.  **Validation:** Users rarely buy full carts without consulting friends or family first.

---

## 5. Strategic Roadmap: Features to Add to Stand Out

To make Meesho Sakhi an undeniable industry leader, we should implement the following features. 

> [!TIP]
> **Recommendation:** We should pick **Phase 1** features to build next, as they provide the highest ROI for user engagement.

### Phase 1: High Impact & High Feasibility (Start Here)

#### 1. Voice Input (Speech-to-Text in Vernacular Languages)
*   **Why:** Bharat users heavily use voice notes on WhatsApp. Typing "I need a kitchen setup for 5000" in English is a barrier. Speaking *"Mujhe 5000 mein kitchen ka saaman chahiye"* is frictionless.
*   **Plan:** Integrate the Web Speech API on the frontend. Add a glowing microphone button next to the "Start Shopping" button. Capture the speech, translate it to English text (if needed), and feed it to the Goal Agent.

#### 2. Collaborative "Share with Family" Carts
*   **Why:** High-ticket purchases (like moving to a hostel) require parental or roommate approval.
*   **Plan:** Upgrade the current "Share List" button. Instead of printing a PDF, it should generate a unique URL (or a highly formatted WhatsApp message). The WhatsApp message should cleanly list the items, the budget saved, and the overall trust score.

### Phase 2: Advanced AI Capabilities (Market Disruptors)

#### 3. Visual Search / "Shop the Vibe" (Multimodal AI)
*   **Why:** A user sees a beautifully decorated room on Instagram and wants it.
*   **Plan:** Add an image upload button. Use a Vision model (like Claude 3.5 Sonnet Vision) to analyze the uploaded image, extract the aesthetic (e.g., "Boho", "Minimalist"), identify key items, and have the agents build a cart to replicate that exact look on Meesho.

#### 4. Deal Anticipation & FOMO Agent
*   **Why:** Price sensitivity is the #1 driving factor on Meesho.
*   **Plan:** Add an 8th Agent to the pipeline: The **Deal Agent**. Before checkout, this agent analyzes the cart and says, *"Wait! The Philips Desk Lamp usually drops by ₹150 during the weekend sale. Should I hold it in your wishlist?"* This builds immense loyalty because the AI is actively trying to save the user money, even if it delays a sale.

---

## 6. Next Steps for Development
If you agree with this assessment, I recommend we begin implementing **Feature #1 (Voice Input)** or **Feature #2 (WhatsApp Cart Sharing)** immediately to significantly boost the app's usability. 

Let me know which one you'd like to tackle first!


Meesho Sakhi — Final Walkthrough
All 16 phases complete. Here's what was built.

Architecture

frontend/src/
├── App.jsx              — Router + LangProvider wrapper
├── i18n.jsx             — Multilingual system (EN/HI/TA/BN)
├── index.css            — Full design system (vars, utils, mobile responsive)
├── components/
│   ├── Layout.jsx       — Sticky header, mobile bottom nav with FAB, lang switcher
│   └── ChatRefinement.jsx — Conversational cart refinement chat UI
├── pages/
│   ├── LandingPage.jsx  — Full marketing site (hero, features, testimonials, CTA)
│   ├── Auth.jsx         — Login / Sign up form
│   ├── Dashboard.jsx    — Welcome hero, stats, recent plans, quick actions
│   ├── AskSakhi.jsx     — 8-agent pipeline UI + ChatRefinement
│   ├── Wishlist.jsx     — Saved items with remove action
│   └── History.jsx      — Past shopping plans with progress bars
├── CartView.jsx         — Smart Cart with Health Score + "Why Sakhi Picked This" modal
├── PipelineView.jsx     — Live agent pipeline with progress bar + animations
└── usePipeline.js       — SSE streaming hook (unchanged)
backend/
├── main.py              — FastAPI app, hardened CORS, security headers middleware
├── orchestrator.py      — AgentOrchestrator class wrapping the 8-agent pipeline
├── agents.py            — 8 agent functions (unchanged)
├── database.py          — SQLAlchemy + SQLite
├── models.py            — User, ShoppingGoal, CartItem ORM models
├── schemas.py           — Pydantic DTOs
└── routers/
    ├── shop.py          — POST /shop → SSE streaming pipeline
    ├── meesho.py        — Meesho integration endpoints
    └── auth.py          — JWT register/login endpoints
Key Features Delivered
Feature	Location
8-Agent AI Pipeline	orchestrator.py → PipelineView.jsx
Smart Cart + Health Score	CartView.jsx
"Why Sakhi Picked This" modal	CartView.jsx
Conversational Refinement	ChatRefinement.jsx
JWT Authentication	routers/auth.py + Auth.jsx
Wishlist	Wishlist.jsx
Shopping History	History.jsx
Dashboard	Dashboard.jsx
Mobile Bottom Nav with FAB	Layout.jsx
PWA Manifest	public/manifest.json
4-language i18n	i18n.jsx (EN, हिंदी, தமிழ், বাংলা)
SEO + Open Graph	index.html
Security Headers	main.py middleware
Build Size	278KB JS / 4KB CSS ✅
Running Locally
bash

# Backend (port 8000)
cd backend && python -m uvicorn main:app --reload --port 8000
# Frontend (port 5173)
cd frontend && npm run dev
Visit http://localhost:5173 — the Vite proxy routes /shop, /auth, /meesho to the backend automatically.

TIP

Open http://localhost:8000/docs to see the full FastAPI interactive API documentation with all endpoints.

NOTE

The ANTHROPIC_API_KEY in backend/.env enables Claude-powered agent responses. Without it the pipeline still runs using deterministic fallback logic.