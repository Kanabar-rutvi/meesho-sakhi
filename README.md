# 🛍️ Meesho Sakhi — AI Shopping Companion

[![Live Frontend](https://img.shields.io/badge/Live%20Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://meesho-sakhii.vercel.app)
[![Backend API](https://img.shields.io/badge/Live%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://meesho-sakhi.onrender.com)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

> **Meesho Sakhi** is a next-generation AI shopping assistant and e-commerce marketplace platform. Built with an **8-agent LLM orchestration pipeline**, **Catalog Intelligence engine**, **Hybrid Search**, and **dynamic personalization**, Sakhi transforms online shopping from static search-and-scroll into an intuitive, goal-driven conversational experience.

---

## 🚀 Live Demo & Links

- **Frontend Application**: [https://meesho-sakhii.vercel.app](https://meesho-sakhii.vercel.app)
- **Backend Health Check**: [https://meesho-sakhi.onrender.com/health](https://meesho-sakhi.onrender.com/health)

---

## 🌟 Key Features

### 1. 🧠 Multi-Agent AI Shopping Pipeline
- **Specialized Multi-Agent Orchestration**: Deconstructs user intent across 8 distinct agents rather than relying on a single prompt.
- **Real-Time Streaming**: Live streaming of agent reasoning steps directly to the frontend via Server-Sent Events (SSE).
- **Budget & Constraint Enforcement**: Strict budget allocation and category-specific financial breakdown.
- **Review Authenticity Scoring**: Automated Review Trust Agent calculates confidence and authenticity scores on customer reviews.

### 2. 🏪 Real Marketplace Catalog (130+ Curated Products)
- Comprehensive catalog spanning **5 major categories**:
  - 👗 **Fashion & Apparel**: Kurtas, sarees, ethnic wear, streetwear, jackets, denim.
  - ⚡ **Electronics & Gadgets**: Wireless earbuds, smartwatches, keyboards, power banks.
  - 🏡 **Home & Living**: Bedsheets, lamps, aroma diffusers, kitchen appliances.
  - 💄 **Beauty & Personal Care**: Vitamin C serums, sunscreens, matte lipsticks, haircare.
  - 🎒 **Accessories & Footwear**: Running sneakers, leather wallets, polarized sunglasses, canvas backpacks.
- **1:1 Image Uniqueness**: Every single product features a distinct, high-resolution primary image.
- **Zero Cross-Category Contamination**: Strict semantic matching guarantees product visual accuracy.

### 3. 🔍 Hybrid Search & Intelligent Filtering
- **Natural Language Parsing**: Translates queries like *"casual sneakers for men under 1500"* into structured filters (category, tags, budget, rating).
- **Multi-Factor Ranking**: Ranks candidate items using semantic relevance, user price affinity, discount weighting, and verified ratings.

### 4. 🎯 Preference Learning & Personalization
- **Behavioral Event Tracking**: Captures user interactions (views, cart additions, purchases, searches).
- **Dynamic Affinity Profiling**: Adjusts recommendation scoring based on user category affinity, brand preference, and price comfort zones.

### 5. 🔐 Full-Featured User Experience
- **Authentication**: JWT-based session security with bcrypt password hashing.
- **Password Recovery**: Integrated Nodemailer email delivery via secure SMTP.
- **Commerce Features**: Persistent cart, interactive wishlist/saved items, live checkout flow, and category filtering.
- **Responsive Design**: Designed for both mobile screens and desktop viewports with dark mode support.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([User Query / Message]) --> Router[Intent Router]
    
    subgraph Pipeline [8-Agent Orchestration Pipeline]
        Router --> Goal[Goal Agent]
        Goal --> Planner[Planner Agent]
        
        subgraph CategoryLevel [Per-Category Processing]
            Planner --> Filter[Filter Agent]
            Filter --> Ranker[Ranker Agent]
            Ranker --> Selector[Selector Agent]
        end
        
        Selector --> Trust[Review Trust Agent]
        Trust --> Reco[Recommendation Agent]
        Reco --> Checkout[Checkout Agent]
    end
    
    subgraph DataServices [Catalog & Data Layer]
        Selector -.-> HybridSearch[Hybrid Search Engine]
        HybridSearch -.-> CatalogDB[(Supabase PostgreSQL)]
        Reco -.-> Personalization[Preference Learning Model]
    end
    
    Checkout --> SSE[Server-Sent Events Stream]
    SSE --> UI[Responsive React UI & Live Cart]
```

### The 8-Agent Pipeline Breakdown
1. **Goal Agent**: Identifies overarching shopping intent, occasion, and constraints.
2. **Planner Agent**: Deconstructs shopping goals into targeted per-category budgets and sub-queries.
3. **Filter Agent**: Evaluates catalog items against hard attributes (size, material, category, specifications).
4. **Ranker Agent**: Scores candidate products against semantic relevance and user preference history.
5. **Selector Agent**: Selects the optimal basket maximizing value within specified budget constraints.
6. **Review Trust Agent**: Analyzes customer feedback to compute authenticity and trust scores.
7. **Recommendation Agent**: Formulates companion recommendations, savings tips, and styling advice.
8. **Checkout Agent**: Packages items into an actionable cart with total savings and breakdown.

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite | High-performance, reactive single-page app |
| **Icons & UI** | Lucide React, Canvas Confetti | Modern UI components & micro-interactions |
| **Backend** | Node.js (ES Modules), Express | REST API, SSE streaming, authentication |
| **Database & ORM** | PostgreSQL (Supabase), Prisma ORM | Relational data persistence with connection pooling |
| **AI / LLM** | Anthropic Claude 3.5 Sonnet | Agent reasoning and natural language processing |
| **Email Service** | Nodemailer (SMTP) | Transactional verification and password recovery |
| **Validation** | Zod, Custom Vision Providers | Request schema validation & catalog integrity |
| **Testing** | Node.js Test Runner | 11 comprehensive automated test suites |
| **Deployment** | Vercel (Frontend), Render (Backend) | Global Edge CDN & managed Node.js container |

---

## 📁 Repository Structure

```
meesho-sakhi/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Prisma schema (User, Product, Order, Interaction)
│   │   └── seed.js                  # Database seed script
│   ├── src/
│   │   ├── config/                  # Environment & app configurations
│   │   ├── controllers/             # Auth, User, Shop, Product controllers
│   │   ├── data/                    # Clean marketplace catalog data
│   │   ├── middlewares/             # JWT auth, rate limiter, error handling
│   │   ├── routers/                 # Express API routes
│   │   ├── services/
│   │   │   ├── catalogIntelligence/ # Vision providers, image validators, confidence scorer
│   │   │   ├── hybridSearchService.js
│   │   │   ├── personalizationService.js
│   │   │   ├── rankingService.js
│   │   │   └── recommendationService.js
│   │   ├── utils/                   # Database client, token generator, email service
│   │   ├── app.js                   # Express application setup
│   │   └── index.js                 # Server entrypoint
│   └── tests/                       # 11 automated test suites
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, ProductCard, Footer, Modals
│   │   ├── pages/                   # Home, Explore, Assistant, Auth, Profile, Wishlist
│   │   ├── services/                # API client, SSE stream listener
│   │   ├── App.jsx                  # Main router and state providers
│   │   └── main.jsx                 # Vite application entrypoint
│   ├── index.html
│   └── vite.config.js
├── package.json                     # Monorepo root scripts
└── README.md                        # Documentation
```

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **PostgreSQL**: Local instance or remote Supabase/Neon connection URL

---

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/Kanabar-rutvi/meesho-sakhi.git
cd meesho-sakhi

# Install dependencies for both frontend and backend
npm run install:all
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`)
Create `backend/.env` with the following variables:
```env
# Database connection (Prisma / Supabase pooler)
DATABASE_URL="postgresql://postgres:password@localhost:5432/meesho_sakhi?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/meesho_sakhi?schema=public"

# Authentication
JWT_SECRET="your-256-bit-secret"
CONVERSATION_ENCRYPTION_KEY="your-encryption-key"

# Server Configuration
PORT=8000
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000,http://localhost:8000"

# Optional: Anthropic Claude API (Runs on intelligent fallback if omitted)
ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Email Service for Password Resets
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

#### Frontend (`frontend/.env`)
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

---

### Step 3: Initialize Database
```bash
cd backend

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed product catalog
npx prisma db seed
cd ..
```

---

### Step 4: Run Development Servers

**Run backend and frontend concurrently** from root:
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Server running at http://localhost:8000

# Terminal 2: Frontend
cd frontend
npm run dev
# Application running at http://localhost:5173
```

---

## 🧪 Testing

The backend includes **11 end-to-end and unit test suites**:
```bash
cd backend
npm test
```

### Verified Test Suites:
1. `test_catalog.js` — Catalog schema and product structure validation.
2. `test_catalog_architecture.js` — Architecture boundaries and ingestion flows.
3. `test_product_search_service.js` — Query matching and filter accuracy.
4. `test_intent_router.js` — User intent classification.
5. `test_conversation_context.js` — Multi-turn conversation state retention.
6. `test_recommendation_architecture.js` — Recommendation generation and fallback logic.
7. `test_catalog_validation.js` — Image confidence scoring and duplicate detection.
8. `test_real_marketplace_catalog.js` — 1:1 image uniqueness and zero cross-category contamination.
9. `test_hybrid_search.js` — Natural language parsing, budget, and rating constraints.
10. `test_ranking_service.js` — Multi-factor ranking computation.
11. `test_personalization_service.js` — Affinity scoring and interaction tracking.

---

## 🚢 Deployment

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set Environment Variable:
   - `VITE_API_URL`: Your live backend URL (e.g., `https://meesho-sakhi.onrender.com`).
4. Deploy!

### Backend (Render)
1. Create a **Web Service** on [Render](https://render.com) connected to the repository.
2. Set Root Directory to `backend`.
3. Set Build Command: `npm install && npx prisma generate`
4. Set Start Command: `node src/index.js`
5. Configure Environment Variables in Render Dashboard:
   - `DATABASE_URL`: Transaction-mode pooler URL (IPv4-compatible).
   - `JWT_SECRET`: Random secure string.
   - `ALLOWED_ORIGINS`: Comma-separated list including your Vercel URL.
   - `ANTHROPIC_API_KEY`: *(Optional)* Anthropic API key.

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
