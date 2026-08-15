import express from 'express';
import { authenticateToken } from './auth.js';
import prisma from '../utils/db.js';
import { PreferenceEngine } from '../utils/preferenceEngine.js';

const router = express.Router();

router.use(authenticateToken);

// Fetch user history (Shopping Goals, Plans, and their Items)
router.get('/history', async (req, res) => {
  try {
    const goals = await prisma.shoppingGoal.findMany({
      where: { user_id: req.user.id },
      include: {
        plans: {
          include: {
            items: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const history = goals.flatMap(goal => 
      goal.plans.map(plan => {
        const spent = plan.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categories = [...new Set(plan.items.map(i => i.category))];
        
        return {
          id: `h${plan.id}`,
          goal: goal.query,
          budget: plan.total_budget || goal.budget,
          spent: spent,
          items: plan.items.length,
          date: plan.created_at.toISOString().split('T')[0],
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
            trust_score: item.trust_score,
            reason: item.reason
          }))
        };
      })
    );

    res.json(history);
  } catch (error) {
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

export default router;

