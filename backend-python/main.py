import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import shop, meesho, auth
from database import engine, Base

# Create all tables in sqlite
Base.metadata.create_all(bind=engine)

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Meesho Sakhi API",
    description="Agentic AI shopping pipeline for Meesho Sakhi",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# In production, replace with your actual frontend domain
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:8000"
).split(",")

# Clean up origins (strip whitespace)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
)

# ─── Security Headers Middleware ──────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# ─── Global Exception Handler ────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

# ─── Routers ─────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent

with (BASE_DIR / "catalog.json").open("r", encoding="utf-8") as f:
    CATALOG = json.load(f)

app.include_router(auth.router)
app.include_router(shop.router)
app.include_router(meesho.router)

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "catalog_size": len(CATALOG),
        "features": ["8-agent-pipeline", "auth-jwt", "sse-streaming", "conversational-refinement"]
    }

# ─── Root endpoint (for deployment verification) ──────────────────────────────
@app.get("/", tags=["system"])
async def root():
    return {
        "name": "Meesho Sakhi API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }
