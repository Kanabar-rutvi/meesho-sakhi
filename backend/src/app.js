import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routers/auth.js';
import shopRoutes from './routers/shop.js';
import adminRoutes from './routers/admin.js';
import learnRoutes from './routers/learn.js';
import userRoutes from './routers/user.js';
import meeshoRoutes from './routers/meesho.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:8000,http://localhost:5174")
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get('/', (req, res) => {
  res.json({
    name: "Meesho Sakhi API (Node.js)",
    version: "2.0.0",
    status: "running",
    health: "/health"
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    version: "2.0.0",
    features: ["8-agent-pipeline", "auth-jwt", "sse-streaming", "conversational-refinement", "node-js-backend", "learning-preference-model"]
  });
});

app.use('/auth', authRoutes);
app.use('/shop', shopRoutes);
app.use('/admin', adminRoutes);
app.use('/learn', learnRoutes);
app.use('/user', userRoutes);
app.use('/meesho', meeshoRoutes);

app.use(errorHandler);

export default app;
