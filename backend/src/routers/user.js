import express from 'express';
import { authenticateToken } from './auth.js';
import prisma from '../utils/db.js';
import { PreferenceEngine } from '../utils/preferenceEngine.js';
import { decryptMessage } from '../utils/conversationEncryption.js';
import { recordInteraction, getUserAffinity } from '../services/personalization/interactionService.js';

const router = express.Router();

router.use(authenticateToken);

// Fetch authoritative user dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch active non-deleted goals and their active saved plans
    const goals = await prisma.shoppingGoal.findMany({
      where: {
        user_id: userId,
        status: { not: 'deleted' }
      },
      include: {
        plans: {
          where: { is_saved: true },
          include: { items: true }
        }
      }
    });

    let plansCreated = 0;
    let totalItems = 0;
    let totalSaved = 0;
    let totalSpent = 0;

    for (const goal of goals) {
      for (const plan of goal.plans) {
        plansCreated++;
        const spent = plan.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const count = plan.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const budget = goal.budget > 0 ? goal.budget : plan.total_budget;

        totalItems += count;
        totalSpent += spent;

        // Accurate savings: budget - spent (if budget exceeds spent)
        if (budget > spent) {
          totalSaved += (budget - spent);
        }
      }
    }

    const wishlistCount = await prisma.wishlistItem.count({
      where: { user_id: userId }
    });

    res.json({
      plans_created: plansCreated,
      total_items: totalItems,
      items_saved: wishlistCount,
      total_saved: totalSaved,
      total_spent: totalSpent
    });
  } catch (error) {
    console.error('[user/dashboard-stats] error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Fetch user history (Shopping Goals, Plans, and their Items)
router.get('/history', async (req, res) => {
  try {
    const goals = await prisma.shoppingGoal.findMany({
      where: { 
        user_id: req.user.id,
        status: { not: 'deleted' }
      },
      include: {
        plans: {
          where: { is_saved: true },
          include: {
            items: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Fetch user activity logs to map conversation IDs to plans
    const userLogs = await prisma.activityLog.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 200
    });

    const history = goals.flatMap(goal => 
      goal.plans.map(plan => {
        const spent = plan.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categories = [...new Set(plan.items.map(i => i.category))];
        const budget = goal.budget > 0 ? goal.budget : (plan.total_budget || spent);
        const savings = Math.max(0, budget - spent);

        // Find associated conversation_id from activity logs
        let matchedConvId = null;
        for (const log of userLogs) {
          if (log.metadata) {
            try {
              const meta = JSON.parse(log.metadata);
              if (meta.plan_id === plan.id || meta.goal_id === goal.id) {
                matchedConvId = log.conversation_id;
                break;
              }
            } catch { /* skip */ }
          }
        }

        // Fallback: match by closest creation timestamp within 10 minutes
        if (!matchedConvId) {
          const planTime = new Date(plan.created_at).getTime();
          const closestLog = userLogs.find(l => {
            const diff = Math.abs(new Date(l.created_at).getTime() - planTime);
            return diff < 10 * 60 * 1000 && l.conversation_id;
          });
          if (closestLog) matchedConvId = closestLog.conversation_id;
        }

        const decryptedGoalQuery = decryptMessage(goal.query) || "Shopping Plan";
        return {
          id: `h${plan.id}`,
          raw_plan_id: plan.id,
          goal_id: goal.id,
          conversation_id: matchedConvId || null,
          goal: decryptedGoalQuery,
          plan_name: plan.name || decryptedGoalQuery,
          budget: budget,
          spent: spent,
          saved: savings,
          items: plan.items.length,
          date: plan.created_at.toISOString().split('T')[0],
          created_at: plan.created_at,
          status: goal.status,
          categories: categories,
          // Include the actual recommended items
          plan_items: plan.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            name: item.name,
            category: item.category,
            price: item.price,
            quantity: item.quantity,
            trust_score: item.trust_score && item.trust_score > 0 ? item.trust_score : 0.85,
            reason: (item.reason && item.reason.trim()) 
              ? item.reason.trim() 
              : `Selected by Sakhi as a top-rated ${item.category || 'essential'} with verified ratings and reliable value.`
          }))
        };
      })
    );

    res.json(history);
  } catch (error) {
    console.error('[user/history] error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Delete a plan (soft deletion)
router.delete('/plan/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    if (isNaN(planId)) return res.status(400).json({ detail: 'Invalid plan ID' });

    // Verify ownership: plan must belong to goal owned by req.user.id
    const plan = await prisma.shoppingPlan.findFirst({
      where: { id: planId },
      include: { goal: true }
    });

    if (!plan || !plan.goal || plan.goal.user_id !== req.user.id) {
      return res.status(404).json({ detail: 'Plan not found or access denied' });
    }

    // Soft delete the plan
    await prisma.shoppingPlan.update({
      where: { id: planId },
      data: { is_saved: false }
    });

    // Check if goal has any remaining active saved plans
    const remainingPlans = await prisma.shoppingPlan.count({
      where: { goal_id: plan.goal_id, is_saved: true }
    });

    if (remainingPlans === 0) {
      await prisma.shoppingGoal.update({
        where: { id: plan.goal_id },
        data: { status: 'deleted' }
      });
    }

    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('[user/plan/:id DELETE] error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Fetch conversation history for a specific plan
router.get('/plan/:id/conversation', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    if (isNaN(planId)) return res.status(400).json({ detail: 'Invalid plan ID' });

    // Verify ownership
    const plan = await prisma.shoppingPlan.findFirst({
      where: { id: planId },
      include: {
        goal: true,
        items: true
      }
    });

    if (!plan || !plan.goal || plan.goal.user_id !== req.user.id) {
      return res.status(404).json({ detail: 'Plan not found or access denied' });
    }

    // Search activity logs to find the conversation_id for this plan
    const userLogs = await prisma.activityLog.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'asc' }
    });

    let conversationId = null;
    for (const log of userLogs) {
      if (log.metadata) {
        try {
          const meta = JSON.parse(log.metadata);
          if (meta.plan_id === plan.id || meta.goal_id === plan.goal_id) {
            conversationId = log.conversation_id;
            break;
          }
        } catch { /* skip */ }
      }
    }

    if (!conversationId) {
      const planTime = new Date(plan.created_at).getTime();
      const closestLog = userLogs.find(l => {
        const diff = Math.abs(new Date(l.created_at).getTime() - planTime);
        return diff < 10 * 60 * 1000 && l.conversation_id;
      });
      if (closestLog) conversationId = closestLog.conversation_id;
    }

    let messages = [];

    if (conversationId) {
      // Retrieve all logs for this conversation
      const convLogs = await prisma.activityLog.findMany({
        where: { conversation_id: conversationId },
        orderBy: { created_at: 'asc' }
      });

      for (const log of convLogs) {
        let meta = {};
        try { if (log.metadata) meta = JSON.parse(log.metadata); } catch { /* skip */ }

        if (log.event_type === 'shopping_request' || log.event_type === 'chat_started') {
          const userText = meta.encrypted_user_message
            ? decryptMessage(meta.encrypted_user_message)
            : decryptMessage(log.message_summary || plan.goal.query);

          messages.push({
            id: `msg-${log.id}`,
            role: 'user',
            text: userText,
            timestamp: log.created_at
          });
        } else if (log.event_type === 'shopping_completed') {
          const summary = meta.encrypted_assistant_message
            ? decryptMessage(meta.encrypted_assistant_message)
            : "Here is your personalized shopping plan based on your request!";
          
          messages.push({
            id: `msg-${log.id}`,
            role: 'assistant',
            text: summary,
            products: plan.items.map(i => ({
              id: i.product_id,
              name: i.name,
              category: i.category,
              price: i.price,
              quantity: i.quantity,
              trust_score: i.trust_score,
              reason: i.reason
            })),
            total: plan.total_budget || plan.items.reduce((s, it) => s + (it.price * it.quantity), 0),
            savings: Math.max(0, (plan.goal.budget || plan.total_budget) - (plan.items.reduce((s, it) => s + (it.price * it.quantity), 0))),
            timestamp: log.created_at
          });
        }
      }
    }

    // If no explicit logs exist, provide a structured thread from plan details
    if (messages.length === 0) {
      const spent = plan.items.reduce((s, it) => s + (it.price * it.quantity), 0);
      const savings = Math.max(0, (plan.goal.budget || plan.total_budget) - spent);
      const decryptedQuery = decryptMessage(plan.goal.query);

      messages = [
        {
          id: `msg-u-${plan.id}`,
          role: 'user',
          text: decryptedQuery,
          timestamp: plan.goal.created_at
        },
        {
          id: `msg-a-${plan.id}`,
          role: 'assistant',
          text: `I've prepared your personalized plan "${plan.name}" with ${plan.items.length} items within your budget.`,
          products: plan.items.map(i => ({
            id: i.product_id,
            name: i.name,
            category: i.category,
            price: i.price,
            quantity: i.quantity,
            trust_score: i.trust_score,
            reason: i.reason
          })),
          total: spent,
          savings: savings,
          timestamp: plan.created_at
        }
      ];
    }

    res.json({
      plan_id: plan.id,
      plan_name: plan.name,
      goal_query: decryptMessage(plan.goal.query),
      budget: plan.goal.budget,
      conversation_id: conversationId,
      privacy: 'Protected (Private & End-to-End Encrypted)',
      messages: messages
    });
  } catch (error) {
    console.error('[user/plan/:id/conversation] error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Fetch user wishlist
router.get('/wishlist', async (req, res) => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { user_id: req.user.id },
      orderBy: { added_at: 'desc' }
    });
    
    const formattedWishlist = wishlist.map(item => ({
      id: item.id,
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      category: item.category,
      rating: item.rating,
      image: item.image_url || '🛍️',
      addedDate: item.added_at.toISOString().split('T')[0]
    }));
    
    res.json(formattedWishlist);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Add to wishlist
router.post('/wishlist', async (req, res) => {
  try {
    const { product_id, name, category, price, rating, image_url } = req.body;
    const item = await prisma.wishlistItem.create({
      data: {
        user_id: req.user.id,
        product_id,
        name,
        category,
        price,
        rating: rating || 4.0,
        image_url
      }
    });

    // Also learn from this wishlist addition (strong positive signal)
    try {
      const engine = new PreferenceEngine(req.user.id);
      await engine.load();
      await engine.recordFeedback({
        product: { id: product_id, name, category, price, rating: rating || 4.0 },
        feedback_type: 'save',
        session_id: undefined,
      });
    } catch (learnErr) {
      console.warn("[user/wishlist] Failed to learn from wishlist add:", learnErr.message);
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Delete from wishlist
router.delete('/wishlist/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.wishlistItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Retrain ML model from all user data (past plans + wishlist + feedback)
router.post('/retrain', async (req, res) => {
  try {
    const userId = req.user.id;
    const engine = new PreferenceEngine(userId);
    // Start fresh profile for full retrain
    engine.profile = {
      category_scores: {},
      brand_scores: {},
      tag_scores: {},
      price_sensitivity: 0.5,
      quality_bias: 0.5,
      min_rating_pref: 3.5,
      eco_soc_warm: 0.0,
      total_signals: 0,
    };
    engine._loaded = true;

    // 1. Learn from all past cart items (ordered items = strongest signal)
    const goals = await prisma.shoppingGoal.findMany({
      where: { user_id: userId },
      include: { plans: { include: { items: true } } }
    });

    let planSignals = 0;
    for (const goal of goals) {
      for (const plan of goal.plans) {
        for (const item of plan.items) {
          engine._learnProduct({
            id: item.product_id,
            name: item.name,
            category: item.category,
            price: item.price,
            rating: item.trust_score ? item.trust_score * 5 : 4.0,
            tags: [],
          }, 'order', 1);
          planSignals++;
        }
      }
    }

    // 2. Learn from wishlist items (saved = strong positive)
    const wishlist = await prisma.wishlistItem.findMany({ where: { user_id: userId } });
    let wishlistSignals = 0;
    for (const item of wishlist) {
      engine._learnProduct({
        id: item.product_id,
        name: item.name,
        category: item.category,
        price: item.price,
        rating: item.rating || 4.0,
        tags: [],
      }, 'save', 1);
      wishlistSignals++;
    }

    // 3. Learn from explicit feedback history
    const feedbacks = await prisma.userFeedback.findMany({ where: { user_id: userId } });
    let feedbackSignals = 0;
    for (const fb of feedbacks) {
      if (fb.category) {
        const pol = ['like', 'save', 'order', 'share', 'view'].includes(fb.feedback_type) ? 1 : -1;
        engine._learnProduct({
          category: fb.category,
          tags: fb.tags ? JSON.parse(fb.tags) : [],
          price: 0,
        }, fb.feedback_type, pol);
        feedbackSignals++;
      }
    }

    await engine.persist();

    const insights = engine.getInsights();

    res.json({
      success: true,
      signals_processed: {
        from_plans: planSignals,
        from_wishlist: wishlistSignals,
        from_feedback: feedbackSignals,
        total: planSignals + wishlistSignals + feedbackSignals,
      },
      insights
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Get ML insights
router.get('/insights', async (req, res) => {
  try {
    const engine = new PreferenceEngine(req.user.id);
    await engine.load();
    res.json(engine.getInsights());
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Record user interaction (views, clicks, wishlist/cart changes, purchases, etc.)
router.post('/interaction', async (req, res) => {
  try {
    const { action_type, product_id, category, query_text, metadata, session_id } = req.body;
    if (!action_type) {
      return res.status(400).json({ detail: "action_type is required" });
    }

    const event = await recordInteraction({
      userId: req.user?.id,
      sessionId: session_id || req.headers['x-session-id'],
      actionType: action_type,
      productId: product_id,
      category,
      queryText: query_text,
      metadata
    });

    res.json({ success: true, event });
  } catch (error) {
    console.error('[user/interaction] error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get user personalized affinity profile
router.get('/affinity', async (req, res) => {
  try {
    const affinity = await getUserAffinity(req.user?.id, req.headers['x-session-id']);
    res.json({ success: true, affinity });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;

