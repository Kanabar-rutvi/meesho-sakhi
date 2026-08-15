import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "meesho-sakhi-super-secret-key-for-demo-purposes";
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7; // 1 week

// Middleware to get current user (strict — requires valid token)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ detail: 'Could not validate credentials' });

  jwt.verify(token, SECRET_KEY, async (err, payload) => {
    if (err) return res.status(401).json({ detail: 'Could not validate credentials' });
    
    const user = await prisma.user.findUnique({ where: { email: payload.sub } });
    if (!user) return res.status(401).json({ detail: 'Could not validate credentials' });

    req.user = user;
    next();
  });
};

// Optional auth — if valid JWT present, attach user; otherwise continue as guest
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) { next(); return; }

  jwt.verify(token, SECRET_KEY, async (err, payload) => {
    if (!err) {
      try {
        const user = await prisma.user.findUnique({ where: { email: payload.sub } });
        if (user) req.user = user;
      } catch { /* ignore */ }
    }
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ detail: 'Forbidden: Admin access required' });
  }
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ detail: "Email already registered" });
    }

    const hashed_password = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashed_password
      }
    });

    const { hashed_password: _hp, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    // Handling form-data or JSON (FastAPI used OAuth2PasswordRequestForm which is form-data typically, 
    // but we can handle JSON or form-data here. Let's assume frontend sends x-www-form-urlencoded or JSON)
    const email = req.body.username || req.body.email;
    const password = req.body.password;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
      return res.status(401).json({ detail: "Incorrect email or password" });
    }

    const token = jwt.sign({ sub: user.email }, SECRET_KEY, { expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` });
    res.json({ access_token: token, token_type: "bearer" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const { hashed_password: _hp, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

export default router;
