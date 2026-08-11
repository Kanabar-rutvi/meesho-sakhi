import express from 'express';
import fs from 'fs';
import path from 'path';
import { PreferenceEngine } from '../utils/preferenceEngine.js';
import { optionalAuthenticate } from './auth.js';

const router = express.Router();

// Lazy-load catalog (same as shop router does)
let CATALOG = [];
try {
  const catalogPath = path.resolve(process.cwd(), 'catalog.json');
  CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error("[learn router] Failed to load catalog.json:", e.message);
}

// Optional auth (guest sessions with session_id also allowed)
const resolveIdentity = (req) => {
  let userId = null;
  if (req.user && req.user.id) userId = req.user.id;
  const sessionId = req.body?.session_id || req.query?.session_id || null;
  return { userId, sessionId };
};

/**
 * GET /learn/profile
 *   Query: ?session_id=xyz (guest) OR logged-in user via JWT
 *   Returns current learned profile + insights
 */
router.get('/profile', optionalAuthenticate, async (req, res) => {
  try {
    const { userId, sessionId } = resolveIdentity(req);
    const engine = new PreferenceEngine(userId || null);
    await engine.load();
    res.json({
      user_id: userId,
      session_id: sessionId,
      profile: engine.profile,
      insights: engine.getInsights(),
    });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

/**
 * POST /learn/feedback
 *   body: {
 *     feedback_type: "like"|"dislike"|"save"|"remove"|"replace"|"order"|"view"|"share",
 *     product_id: "B002" | category: "bedding" + tags: ["foldable"],
 *     rating: 1-5 (optional explicit),
 *     comment: "too expensive",
 *     session_id: "uuid",
 *     goal_id: 123,
 *     weight: 1.0 (optional signal multiplier)
 *   }
 */
router.post('/feedback', optionalAuthenticate, async (req, res) => {
  try {
    const { userId, sessionId } = resolveIdentity(req);
    const { feedback_type, product_id, category, tags, rating, comment, goal_id, weight } = req.body || {};

    if (!feedback_type) {
      return res.status(400).json({ detail: "feedback_type is required" });
    }
    if (!product_id && !category) {
      return res.status(400).json({ detail: "product_id or category is required" });
    }

    const engine = new PreferenceEngine(userId || null);
    await engine.load();
    await engine.recordFeedback({
      feedback_type,
      product_id,
      category,
      tags,
      rating: rating != null ? Number(rating) : null,
      comment,
      session_id: sessionId,
      goal_id: goal_id ? Number(goal_id) : undefined,
      weight: weight != null ? Number(weight) : 1.0,
      catalog: CATALOG,
    });
    res.json({ ok: true, insights: engine.getInsights() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: e.message });
  }
});

/**
 * POST /learn/interaction
 *   body: {
 *     action_type: "refine_request"|"swap"|"add_category"|"remove_category"|"budget_change",
 *     query_text: "swap mattress for foldable one",
 *     category: "bedding",
 *     product_from: "B001",
 *     product_to: "B003",
 *     session_id: "uuid",
 *     metadata: { price_delta: -400 }
 *   }
 */
router.post('/interaction', optionalAuthenticate, async (req, res) => {
  try {
    const { userId, sessionId } = resolveIdentity(req);
    const { action_type, query_text, category, product_from, product_to, metadata } = req.body || {};

    if (!action_type) {
      return res.status(400).json({ detail: "action_type is required" });
    }

    const engine = new PreferenceEngine(userId || null);
    await engine.load();
    await engine.recordInteraction({
      action_type,
      query_text,
      category,
      product_from,
      product_to,
      session_id: sessionId,
      metadata,
      catalog: CATALOG,
    });
    res.json({ ok: true, insights: engine.getInsights() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ detail: e.message });
  }
});

/**
 * POST /learn/score
 *   body: { product_ids: ["B001", "B002", ...], session_id? }
 *   Returns per-product learned scores (for frontend sort)
 */
router.post('/score', optionalAuthenticate, async (req, res) => {
  try {
    const { userId, sessionId } = resolveIdentity(req);
    const { product_ids } = req.body || {};
    if (!Array.isArray(product_ids)) {
      return res.status(400).json({ detail: "product_ids array required" });
    }
    const engine = new PreferenceEngine(userId || null);
    await engine.load();
    const scores = {};
    for (const pid of product_ids) {
      const product = CATALOG.find(p => p.id === pid);
      scores[pid] = product ? engine.scoreProduct(product) : 0;
    }
    res.json({ scores, insights: engine.getInsights() });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

/**
 * GET /learn/insights (optional auth)
 *   Returns lightweight insights without full profile
 */
router.get('/insights', async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      // Lazily extract user via JWT if valid, otherwise guest
      try {
        const [, token] = authHeader.split(' ');
        const { jwt } = await import('./auth.js');
        const jwt2 = (await import('jsonwebtoken')).default;
        const SECRET_KEY = process.env.JWT_SECRET || "meesho-sakhi-super-secret-key-for-demo-purposes";
        const payload = jwt2.verify(token, SECRET_KEY);
        const prisma = (await import('../utils/db.js')).default;
        const user = await prisma.user.findUnique({ where: { email: payload.sub } });
        if (user) userId = user.id;
      } catch { /* guest */ }
    }
    const engine = new PreferenceEngine(userId);
    await engine.load();
    res.json(engine.getInsights());
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

export default router;
