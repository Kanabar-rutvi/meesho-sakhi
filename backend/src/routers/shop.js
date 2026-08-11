import express from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { AgentOrchestrator } from '../utils/orchestrator.js';
import prisma from '../utils/db.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "meesho-sakhi-super-secret-key-for-demo-purposes";

// Load catalog
let CATALOG = [];
try {
  const catalogPath = path.resolve(process.cwd(), 'catalog.json');
  CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error("Failed to load catalog.json:", e);
}

const optionalAuth = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let userId = null;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRET_KEY);
      const user = await prisma.user.findUnique({ where: { email: payload.sub } });
      if (user) userId = user.id;
    } catch {
      // Invalid token — treat as guest
    }
  }
  return userId;
};

router.post('/', async (req, res) => {
  try {
    const { query, session_id } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ detail: "Query cannot be empty" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');

    const userId = await optionalAuth(req);
    const orchestrator = new AgentOrchestrator(CATALOG, userId, session_id || null);

    for await (const chunk of orchestrator.executeFullPlan(query)) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    console.error("Pipeline error:", error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

export default router;
