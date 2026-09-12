import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routers/auth.js';
import shopRoutes from './routers/shop.js';
import adminRoutes from './routers/admin.js';
import learnRoutes from './routers/learn.js';
import userRoutes from './routers/user.js';
import meeshoRoutes from './routers/meesho.js';
import productsRoutes from './routers/products.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter.js';

import prisma from './utils/db.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Enable if behind a reverse proxy (e.g. Vercel/Render)

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://meesho-sakhii.vercel.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:8000,http://localhost:5174")
  .split(',')
  .map(o => o.trim().replace(/\/$/, ""));

const FORCE_ALLOWED = [
  "https://meesho-sakhii.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://localhost:8000",
  "http://localhost:5174"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    if (ALLOWED_ORIGINS.includes(normalized) || ALLOWED_ORIGINS.includes("*") || FORCE_ALLOWED.includes(normalized)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  exposedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Apply global API limiter
app.use(apiLimiter);

app.get('/', (req, res) => {
  res.json({
    name: "Meesho Sakhi API (Node.js)",
    version: "2.0.0",
    status: "running",
    health: "/health"
  });
});

app.get('/health', async (req, res) => {
  let dbStatus = "connected";
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "disconnected";
    dbError = err.message || String(err);
  }

  const isOk = dbStatus === "connected";
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':***@') : null;

  res.status(isOk ? 200 : 503).json({
    status: isOk ? "ok" : "degraded",
    database: dbStatus,
    db_error: dbError,
    has_db_url: !!process.env.DATABASE_URL,
    db_url_masked: maskedUrl,
    version: "2.0.0",
    features: ["8-agent-pipeline", "auth-jwt", "sse-streaming", "conversational-refinement", "node-js-backend", "learning-preference-model"]
  });
});

// Apply authLimiter to auth routes
app.use('/auth', authLimiter, authRoutes);
app.use('/shop', shopRoutes);
app.use('/admin', adminRoutes);
app.use('/learn', learnRoutes);
app.use('/user', userRoutes);
app.use('/meesho', meeshoRoutes);
app.use('/products', productsRoutes);

app.use(errorHandler);

export default app;
