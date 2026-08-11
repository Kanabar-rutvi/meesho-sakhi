import express from 'express';
import { authenticateToken, requireAdmin } from './auth.js';
import prisma from '../utils/db.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const goalCount = await prisma.shoppingGoal.count();
    const planCount = await prisma.shoppingPlan.count();
    
    res.json({
      users: userCount,
      goals: goalCount,
      plans: planCount
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        created_at: true
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.shoppingPlan.findMany({
      include: {
        goal: {
          include: {
            user: {
              select: { email: true, name: true }
            }
          }
        },
        items: true
      }
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
