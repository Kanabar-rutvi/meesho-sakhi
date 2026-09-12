import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../utils/db.js';
import { authenticateToken, requireAdmin } from './auth.js';
import { getCatalogStats } from '../utils/productSearchService.js';
import {
  getAllProducts,
  getProductById,
  addProduct as catalogAdd,
  updateProduct as catalogUpdate,
  deactivateProduct as catalogDeactivate,
} from '../utils/catalog.js';
import { validateProduct, normalizeProduct } from '../utils/productIngestionService.js';
import { CatalogValidator, CatalogRepair, CatalogReport } from '../services/catalogIntelligence/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOG_PATH = path.resolve(__dirname, '..', '..', 'catalog.json');

const router = express.Router();
router.use(authenticateToken);
router.use(requireAdmin);

// ─── Audit logging helper ─────────────────────────────────────────────────────
async function logAdminAction(adminId, event_type, message_summary, metadata = {}) {
  try {
    await prisma.activityLog.create({
      data: { user_id: adminId, event_type, message_summary, metadata: JSON.stringify(metadata), success: true }
    });
  } catch (e) {
    console.error('[admin audit log] failed:', e.message);
  }
}

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const total_users = await prisma.user.count();
    const total_activity = await prisma.activityLog.count();
    const total_shopping_requests = await prisma.activityLog.count({ where: { event_type: 'shopping_request' } });
    const successful_requests = await prisma.activityLog.count({ where: { event_type: 'shopping_completed' } });
    const failed_requests = await prisma.activityLog.count({ where: { event_type: 'shopping_failed' } });
    const total_conversations = await prisma.activityLog.count({
      where: { event_type: 'chat_started', intent: { in: ['greeting','gratitude','general_chat','unclear','product_question','shopping_followup'] } }
    });
    const total_shopping_plans = await prisma.shoppingPlan.count();
    const total_cart_items = await prisma.cartItem.count();
    const total_wishlist_items = await prisma.wishlistItem.count();
    const total_shopping_goals = await prisma.shoppingGoal.count();
    const verified_users = await prisma.user.count({ where: { email_verified: true } });
    const unverified_users = total_users - verified_users;
    const active_users = await prisma.user.count({ where: { is_active: true } });

    const recent_users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' }, take: 5,
      select: { id: true, name: true, email: true, email_verified: true, created_at: true, is_active: true }
    });
    const recent_activity = await prisma.activityLog.findMany({
      orderBy: { created_at: 'desc' }, take: 5,
      include: { user: { select: { email: true, name: true } } }
    });
    const recent_shopping_activity = await prisma.shoppingGoal.findMany({
      orderBy: { created_at: 'desc' }, take: 5,
      select: {
        id: true,
        budget: true,
        status: true,
        created_at: true,
        user: { select: { email: true, name: true } },
        plans: { select: { id: true, name: true, total_budget: true, items: true } }
      }
    });

    res.json({
      total_users, verified_users, unverified_users, active_users,
      total_activity, total_shopping_requests, total_conversations,
      successful_requests, failed_requests,
      total_shopping_goals, total_shopping_plans, total_cart_items, total_wishlist_items,
      recent_users, recent_activity, recent_shopping_activity
    });
  } catch (error) {
    console.error('[admin/dashboard] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.search) {
      where.OR = [
        { email: { contains: req.query.search, mode: 'insensitive' } },
        { name: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.verified === 'true') where.email_verified = true;
    if (req.query.verified === 'false') where.email_verified = false;
    if (req.query.active === 'true') where.is_active = true;
    if (req.query.active === 'false') where.is_active = false;

    const users = await prisma.user.findMany({
      skip, take: limit, where, orderBy: { created_at: 'desc' },
      select: { id: true, email: true, name: true, role: true, created_at: true, is_active: true, email_verified: true }
    });
    const total = await prisma.user.count({ where });
    res.json({ users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('[admin/users] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, created_at: true, is_active: true, email_verified: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [shopping_goals, wishlist, preferences, activity_logs_raw, interactions, feedbacks] = await Promise.all([
      prisma.shoppingGoal.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          budget: true,
          status: true,
          created_at: true,
          plans: { select: { id: true, name: true, total_budget: true, items: true } }
        }
      }),
      prisma.wishlistItem.findMany({ where: { user_id: userId }, orderBy: { added_at: 'desc' } }),
      prisma.learnedPreferences.findUnique({ where: { user_id: userId } }),
      prisma.activityLog.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 50 }),
      prisma.interactionHistory.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 20 }),
      prisma.userFeedback.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 20 }),
    ]);

    const activity_logs = activity_logs_raw.map(l => {
      let meta = null;
      if (l.metadata) {
        try {
          const parsed = JSON.parse(l.metadata);
          delete parsed.encrypted_user_message;
          delete parsed.encrypted_assistant_message;
          meta = JSON.stringify(parsed);
        } catch { /* skip */ }
      }
      return {
        ...l,
        message_summary: (l.event_type === 'shopping_request' || l.event_type === 'chat_started')
          ? `User Consultation (${l.intent || 'active'})`
          : l.message_summary,
        metadata: meta
      };
    });

    const cart_items = shopping_goals.flatMap(g =>
      g.plans.flatMap(p =>
        p.items.map(item => ({ ...item, plan_name: p.name, goal_budget: g.budget }))
      )
    );

    res.json({ user, shopping_goals, cart_items, wishlist, preferences, activity_logs, interactions, feedbacks });
  } catch (error) {
    console.error('[admin/users/:id] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/logs ──────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.user_id) where.user_id = parseInt(req.query.user_id);
    if (req.query.event_type) where.event_type = req.query.event_type;
    if (req.query.intent) where.intent = req.query.intent;
    if (req.query.success !== undefined && req.query.success !== '') where.success = req.query.success === 'true';
    if (req.query.conversation_id) where.conversation_id = req.query.conversation_id;

    const logsRaw = await prisma.activityLog.findMany({
      where, skip, take: limit, orderBy: { created_at: 'desc' },
      include: { user: { select: { email: true, name: true } } }
    });
    const logs = logsRaw.map(l => {
      let meta = null;
      if (l.metadata) {
        try {
          const parsed = JSON.parse(l.metadata);
          delete parsed.encrypted_user_message;
          delete parsed.encrypted_assistant_message;
          meta = JSON.stringify(parsed);
        } catch { /* skip */ }
      }
      return {
        ...l,
        message_summary: (l.event_type === 'shopping_request' || l.event_type === 'chat_started')
          ? `User Consultation (${l.intent || 'active'})`
          : l.message_summary,
        metadata: meta
      };
    });
    const total = await prisma.activityLog.count({ where });
    res.json({ logs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('[admin/logs] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/carts ─────────────────────────────────────────────────────
router.get('/carts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { category: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.cartItem.findMany({
      where, skip, take: limit, orderBy: { id: 'desc' },
      include: { plan: { include: { goal: { include: { user: { select: { id: true, email: true, name: true } } } } } } }
    });
    const total = await prisma.cartItem.count({ where });
    res.json({ items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('[admin/carts] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/wishlists ─────────────────────────────────────────────────
router.get('/wishlists', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 50;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { category: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.wishlistItem.findMany({
      where, skip, take: limit, orderBy: { added_at: 'desc' },
      include: { user: { select: { id: true, email: true, name: true } } }
    });
    const total = await prisma.wishlistItem.count({ where });
    res.json({ items, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('[admin/wishlists] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/conversations ────────────────────────────────────────────
router.get('/conversations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const where = { conversation_id: { not: null } };
    if (req.query.user_id) where.user_id = parseInt(req.query.user_id);
    if (req.query.intent) where.intent = req.query.intent;
    if (req.query.status === 'success') where.success = true;
    if (req.query.status === 'failed') where.success = false;

    const conversationsRaw = await prisma.activityLog.groupBy({
      by: ['conversation_id'], where,
      _max: { created_at: true },
      orderBy: { _max: { created_at: 'desc' } },
      skip, take: limit
    });
    const totalGroups = await prisma.activityLog.groupBy({ by: ['conversation_id'], where });

    const conversationData = [];
    for (const group of conversationsRaw) {
      const logs = await prisma.activityLog.findMany({
        where: { conversation_id: group.conversation_id },
        orderBy: { created_at: 'asc' },
        include: { user: { select: { id: true, email: true, name: true } } }
      });

      if (!logs.length) continue;

      const lastActivity = logs[logs.length - 1];
      const firstActivity = logs[0];
      const user = logs.find(l => l.user)?.user || null;
      const requestCount = logs.filter(l => l.event_type === 'chat_started' || l.event_type === 'shopping_request').length;
      const totalMessages = logs.length;

      // Extract associated plan details from metadata or goal
      let planDetails = null;
      let associatedPlanId = null;
      let associatedGoalId = null;

      for (const log of logs) {
        if (log.metadata) {
          try {
            const meta = JSON.parse(log.metadata);
            if (meta.plan_id) associatedPlanId = meta.plan_id;
            if (meta.goal_id) associatedGoalId = meta.goal_id;
          } catch { /* skip */ }
        }
      }

      if (associatedPlanId) {
        const p = await prisma.shoppingPlan.findFirst({
          where: { id: associatedPlanId },
          include: { items: true, goal: true }
        });
        if (p) {
          const val = p.items.reduce((s, it) => s + (it.price * it.quantity), 0);
          const bg = p.goal ? p.goal.budget : p.total_budget;
          planDetails = {
            id: p.id,
            name: p.name,
            total_value: val,
            budget: bg,
            savings: Math.max(0, bg - val),
            item_count: p.items.length
          };
        }
      } else if (user) {
        // Fallback: match by timestamp close to conversation start
        const convStart = new Date(firstActivity.created_at).getTime();
        const nearbyGoal = await prisma.shoppingGoal.findFirst({
          where: {
            user_id: user.id,
            created_at: {
              gte: new Date(convStart - 10 * 60 * 1000),
              lte: new Date(convStart + 10 * 60 * 1000)
            }
          },
          include: {
            plans: {
              include: { items: true },
              take: 1
            }
          }
        });

        if (nearbyGoal && nearbyGoal.plans.length > 0) {
          const p = nearbyGoal.plans[0];
          const val = p.items.reduce((s, it) => s + (it.price * it.quantity), 0);
          const bg = nearbyGoal.budget > 0 ? nearbyGoal.budget : p.total_budget;
          planDetails = {
            id: p.id,
            name: p.name || nearbyGoal.query,
            total_value: val,
            budget: bg,
            savings: Math.max(0, bg - val),
            item_count: p.items.length
          };
        }
      }

      // Check for user feedback
      let userRating = null;
      if (user) {
        const feedback = await prisma.userFeedback.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' }
        });
        if (feedback) userRating = feedback.feedback_type;
      }

      conversationData.push({
        conversation_id: group.conversation_id,
        user: user || null,
        plan: planDetails,
        privacy: 'Protected',
        request_count: requestCount,
        message_count: totalMessages,
        created_at: firstActivity.created_at,
        last_activity: lastActivity.created_at,
        last_intent: lastActivity.intent,
        success: lastActivity.success ?? true,
        user_feedback: userRating
      });
    }

    // Support in-memory search filter if search term provided
    let filtered = conversationData;
    const searchTerm = (req.query.search || '').trim().toLowerCase();
    if (searchTerm) {
      filtered = conversationData.filter(c => 
        (c.user?.email && c.user.email.toLowerCase().includes(searchTerm)) ||
        (c.user?.name && c.user.name.toLowerCase().includes(searchTerm)) ||
        (c.plan?.name && c.plan.name.toLowerCase().includes(searchTerm)) ||
        c.conversation_id.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      conversations: filtered,
      pagination: { total: totalGroups.length, page, limit, pages: Math.ceil(totalGroups.length / limit) }
    });
  } catch (error) {
    console.error('[admin/conversations] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/conversations/:id ────────────────────────────────────────
router.get('/conversations/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const logs = await prisma.activityLog.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      include: { user: { select: { id: true, email: true, name: true } } }
    });
    if (!logs.length) return res.status(404).json({ error: 'Conversation not found' });

    const user = logs.find(l => l.user)?.user || null;

    // Detect associated plan
    let associatedPlan = null;
    let planId = null;
    let goalId = null;

    for (const log of logs) {
      if (log.metadata) {
        try {
          const meta = JSON.parse(log.metadata);
          if (meta.plan_id) planId = meta.plan_id;
          if (meta.goal_id) goalId = meta.goal_id;
        } catch { /* skip */ }
      }
    }

    if (planId) {
      associatedPlan = await prisma.shoppingPlan.findFirst({
        where: { id: planId },
        include: { items: true, goal: true }
      });
    } else if (user) {
      const firstTime = new Date(logs[0].created_at).getTime();
      const goal = await prisma.shoppingGoal.findFirst({
        where: {
          user_id: user.id,
          created_at: {
            gte: new Date(firstTime - 10 * 60 * 1000),
            lte: new Date(firstTime + 10 * 60 * 1000)
          }
        },
        include: { plans: { include: { items: true }, take: 1 } }
      });
      if (goal && goal.plans.length > 0) {
        associatedPlan = goal.plans[0];
        associatedPlan.goal = goal;
      }
    }

    // Format plan summary for the response (financial/items only, zero query text)
    let planSummary = null;
    if (associatedPlan) {
      const val = associatedPlan.items.reduce((s, it) => s + (it.price * it.quantity), 0);
      const bg = associatedPlan.goal ? associatedPlan.goal.budget : associatedPlan.total_budget;
      planSummary = {
        id: associatedPlan.id,
        name: associatedPlan.name,
        budget: bg,
        spent: val,
        savings: Math.max(0, bg - val),
        item_count: associatedPlan.items.length,
        items: associatedPlan.items.map(it => ({
          id: it.product_id,
          name: it.name,
          category: it.category,
          price: it.price,
          quantity: it.quantity,
          trust_score: it.trust_score
        }))
      };
    }

    res.json({
      conversation_id: conversationId,
      user,
      plan: planSummary,
      message_count: logs.length,
      request_count: logs.filter(l => l.event_type === 'chat_started' || l.event_type === 'shopping_request').length,
      status: 'Active',
      privacy: 'Protected',
      privacy_notice: 'Conversation content is private and cannot be viewed by administrators.',
      created_at: logs[0]?.created_at,
      last_activity: logs[logs.length - 1]?.created_at
    });
  } catch (error) {
    console.error('[admin/conversations/:id] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/products ──────────────────────────────────────────────────
router.get('/products', (req, res) => {
  try {
    let products = getAllProducts();
    const { search, category, in_stock } = req.query;
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    if (category) products = products.filter(p => p.category === category || p.originalCategory === category);
    if (in_stock !== undefined && in_stock !== '') products = products.filter(p => p.in_stock === (in_stock === 'true'));

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const total = products.length;
    const paginated = products.slice((page - 1) * limit, page * limit);
    const categories = [...new Set(getAllProducts().map(p => p.category))].sort();

    res.json({ products: paginated, categories, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('[admin/products] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── POST /api/admin/products ─────────────────────────────────────────────────
router.post('/products', async (req, res) => {
  try {
    const raw = req.body;
    const { valid, errors } = validateProduct(raw);
    if (!valid) return res.status(400).json({ error: 'Validation failed', details: errors });

    const normalized = normalizeProduct(raw);
    if (getProductById(normalized.id)) return res.status(409).json({ error: `Product with ID '${normalized.id}' already exists.` });

    catalogAdd(normalized);
    const current = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    current.push(raw);
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(current, null, 2));

    await logAdminAction(req.user.id, 'admin_product_created', `Product created: ${normalized.name}`, { product_id: normalized.id });
    res.status(201).json({ product: normalized });
  } catch (error) {
    console.error('[admin/products POST] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── PUT /api/admin/products/:id ──────────────────────────────────────────────
router.put('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const existing = getProductById(productId);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const merged = { ...existing, ...req.body, id: productId };
    const { valid, errors } = validateProduct(merged);
    if (!valid) return res.status(400).json({ error: 'Validation failed', details: errors });

    const normalized = normalizeProduct(merged);
    catalogUpdate(productId, normalized);

    const current = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const idx = current.findIndex(p => p.id === productId);
    if (idx !== -1) current[idx] = { ...current[idx], ...req.body, id: productId };
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(current, null, 2));

    await logAdminAction(req.user.id, 'admin_product_updated', `Product updated: ${normalized.name}`, { product_id: productId });
    res.json({ product: normalized });
  } catch (error) {
    console.error('[admin/products PUT] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── DELETE /api/admin/products/:id (soft delete) ────────────────────────────
router.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const existing = getProductById(productId);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    catalogDeactivate(productId);
    const current = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const idx = current.findIndex(p => p.id === productId);
    if (idx !== -1) current[idx].in_stock = false;
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(current, null, 2));

    await logAdminAction(req.user.id, 'admin_product_deactivated', `Product deactivated: ${existing.name}`, { product_id: productId });
    res.json({ message: `Product '${existing.name}' deactivated (in_stock set to false)` });
  } catch (error) {
    console.error('[admin/products DELETE] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/catalog/stats ────────────────────────────────────────────
router.get('/catalog/stats', (req, res) => {
  try {
    const stats = getCatalogStats();
    res.json(stats);
  } catch (error) {
    console.error('[admin/catalog/stats] error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── GET /api/admin/catalog/quality ───────────────────────────────────────────
router.get('/catalog/quality', async (req, res) => {
  try {
    const current = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const validator = new CatalogValidator({ checkReachability: false });
    const evaluations = await validator.validateCatalog(current);
    const reportData = CatalogReport.buildReportData(evaluations);
    res.json({
      summary: reportData.summary,
      details: evaluations
    });
  } catch (error) {
    console.error('[admin/catalog/quality] error:', error);
    res.status(500).json({ error: 'Failed to inspect catalog quality: ' + error.message });
  }
});

// ─── GET /api/admin/catalog/report ────────────────────────────────────────────
router.get('/catalog/report', async (req, res) => {
  try {
    const current = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const validator = new CatalogValidator({ checkReachability: false });
    const evaluations = await validator.validateCatalog(current);
    const reportData = CatalogReport.buildReportData(evaluations);
    const html = CatalogReport.generateHtmlReport(reportData);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('[admin/catalog/report] error:', error);
    res.status(500).send('<h1>Failed to generate report</h1><p>' + error.message + '</p>');
  }
});

// ─── POST /api/admin/catalog/repair ───────────────────────────────────────────
router.post('/catalog/repair', async (req, res) => {
  try {
    const current = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const validator = new CatalogValidator({ checkReachability: false });
    const validation = await validator.validateCatalog(current);
    
    const repairResult = CatalogRepair.repairCatalog(validation);

    // Save repaired catalog
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(repairResult.repairedCatalog, null, 2));

    await logAdminAction(req.user.id, 'admin_catalog_repaired', `Catalog repaired: ${repairResult.repairLog.length} items updated`, {
      repairedCount: repairResult.repairLog.length
    });

    res.json({
      success: true,
      summary: {
        repaired: repairResult.repairLog.length,
        total: current.length
      },
      actions: repairResult.repairLog
    });
  } catch (error) {
    console.error('[admin/catalog/repair] error:', error);
    res.status(500).json({ error: 'Failed to repair catalog: ' + error.message });
  }
});

export default router;
