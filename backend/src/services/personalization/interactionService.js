/**
 * Personalization & Event Tracking Service
 * 
 * Tracks user actions (views, clicks, adds, removals, purchases, searches)
 * with exponential time decay and computes real-time affinity vectors for
 * personalized ranking and recommendations.
 */

import prisma from '../../utils/db.js';
import { getProductById, getAllProducts } from '../../utils/catalog.js';

// Event Weights
export const ACTION_WEIGHTS = {
  product_view: 1.0,
  product_click: 1.5,
  wishlist_add: 3.0,
  wishlist_remove: -1.5,
  cart_add: 4.0,
  cart_remove: -2.0,
  purchase: 6.0,
  search: 1.2,
  recommendation_click: 2.0,
  recommendation_ignore: -0.5
};

// In-memory fallback and low-latency cache for interactions
const memoryInteractionCache = new Map(); // key: `${userId || 'anon'}_${sessionId || ''}` -> array of events

const HALF_LIFE_DAYS = 7;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates exponential time decay factor.
 * Decays to 0.5 after 7 days.
 */
function calculateDecay(timestamp) {
  const diffDays = (Date.now() - new Date(timestamp).getTime()) / MILLIS_PER_DAY;
  if (diffDays <= 0) return 1.0;
  return Math.pow(0.5, diffDays / HALF_LIFE_DAYS);
}

/**
 * Record a user interaction event.
 */
export async function recordInteraction({
  userId = null,
  sessionId = null,
  actionType,
  productId = null,
  category = null,
  queryText = null,
  metadata = null
}) {
  if (!actionType) {
    throw new Error("actionType is required");
  }

  // Resolve product details if productId is supplied
  let product = null;
  if (productId) {
    product = getProductById(productId);
    if (product && !category) {
      category = product.category;
    }
  }

  const weight = ACTION_WEIGHTS[actionType] !== undefined ? ACTION_WEIGHTS[actionType] : 1.0;
  const eventRecord = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    sessionId,
    actionType,
    productId,
    category,
    queryText,
    metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
    weight,
    product: product ? {
      id: product.id,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      brand: product.brand,
      tags: product.tags || []
    } : null,
    createdAt: new Date().toISOString()
  };

  // 1. Update in-memory ring buffer (fast reads)
  const cacheKey = userId ? `user_${userId}` : `session_${sessionId || 'anonymous'}`;
  if (!memoryInteractionCache.has(cacheKey)) {
    memoryInteractionCache.set(cacheKey, []);
  }
  const events = memoryInteractionCache.get(cacheKey);
  events.push(eventRecord);
  if (events.length > 200) {
    events.shift(); // Keep latest 200 events
  }

  // 2. Persist to Prisma InteractionHistory if DB is reachable
  try {
    if (prisma && prisma.interactionHistory) {
      await prisma.interactionHistory.create({
        data: {
          user_id: userId ? Number(userId) : null,
          session_id: sessionId || null,
          action_type: actionType,
          query_text: queryText || null,
          category: category || (product ? product.category : null),
          product_from: productId || null,
          metadata: eventRecord.metadata
        }
      });
    }
  } catch (err) {
    // Non-blocking error logging (Prisma optional / gracefully degrade)
    console.warn(`[interactionService] DB write failed, using cache fallback: ${err.message}`);
  }

  return eventRecord;
}

/**
 * Computes user affinity profile from recent interactions.
 */
export async function getUserAffinity(userId = null, sessionId = null) {
  const cacheKey = userId ? `user_${userId}` : `session_${sessionId || 'anonymous'}`;
  let rawEvents = memoryInteractionCache.get(cacheKey) || [];

  // If in-memory is empty and userId is provided, try loading from DB
  if (rawEvents.length === 0 && userId && prisma && prisma.interactionHistory) {
    try {
      const dbEvents = await prisma.interactionHistory.findMany({
        where: { user_id: Number(userId) },
        orderBy: { created_at: 'desc' },
        take: 100
      });
      if (dbEvents && dbEvents.length > 0) {
        rawEvents = dbEvents.map(d => {
          const prod = d.product_from ? getProductById(d.product_from) : null;
          return {
            userId: d.user_id,
            sessionId: d.session_id,
            actionType: d.action_type,
            productId: d.product_from,
            category: d.category || (prod ? prod.category : null),
            weight: ACTION_WEIGHTS[d.action_type] || 1.0,
            product: prod,
            createdAt: d.created_at
          };
        });
      }
    } catch (e) {
      // Ignore DB fetch failure
    }
  }

  const categoryScores = {};
  const subcategoryScores = {};
  const brandScores = {};
  const tagScores = {};
  const prices = [];

  let totalSignalWeight = 0;

  for (const ev of rawEvents) {
    const decay = calculateDecay(ev.createdAt);
    const effectiveWeight = (ev.weight || 1.0) * decay;
    totalSignalWeight += Math.abs(effectiveWeight);

    const prod = ev.product || (ev.productId ? getProductById(ev.productId) : null);

    // Category
    const cat = ev.category || (prod ? prod.category : null);
    if (cat) {
      const c = cat.toLowerCase();
      categoryScores[c] = (categoryScores[c] || 0) + effectiveWeight;
    }

    if (prod) {
      // Subcategory
      if (prod.subcategory) {
        const sub = prod.subcategory.toLowerCase();
        subcategoryScores[sub] = (subcategoryScores[sub] || 0) + effectiveWeight;
      }

      // Brand
      if (prod.brand) {
        const b = prod.brand.toLowerCase();
        brandScores[b] = (brandScores[b] || 0) + effectiveWeight;
      }

      // Tags
      if (Array.isArray(prod.tags)) {
        for (const t of prod.tags) {
          const tag = t.toLowerCase();
          tagScores[tag] = (tagScores[tag] || 0) + effectiveWeight;
        }
      }

      // Price preference (only on positive actions)
      if (prod.price && effectiveWeight > 0) {
        prices.push({ price: prod.price, weight: effectiveWeight });
      }
    }
  }

  // Calculate weighted average price
  let avgPrice = 0;
  let minPrice = Infinity;
  let maxPrice = 0;
  if (prices.length > 0) {
    let sumWeightedPrice = 0;
    let sumWeights = 0;
    for (const p of prices) {
      sumWeightedPrice += p.price * p.weight;
      sumWeights += p.weight;
      if (p.price < minPrice) minPrice = p.price;
      if (p.price > maxPrice) maxPrice = p.price;
    }
    avgPrice = Math.round(sumWeightedPrice / (sumWeights || 1));
  } else {
    minPrice = 0;
    maxPrice = 5000;
    avgPrice = 1000;
  }

  return {
    userId,
    sessionId,
    totalSignals: rawEvents.length,
    categoryScores,
    subcategoryScores,
    brandScores,
    tagScores,
    pricePreference: {
      average: avgPrice,
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === 0 ? 5000 : maxPrice
    },
    hasPreferences: rawEvents.length > 0
  };
}

/**
 * Calculates a personalization boost [0.0 to 1.0] for a given product
 * based on user affinity scores.
 */
export function calculatePersonalizationScore(product, userAffinity) {
  if (!userAffinity || !userAffinity.hasPreferences || !product) {
    return 0.5; // neutral fallback
  }

  let score = 0.5;
  const cat = (product.category || '').toLowerCase();
  const sub = (product.subcategory || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();

  // Category boost (up to +0.25 / -0.15)
  if (userAffinity.categoryScores && userAffinity.categoryScores[cat] !== undefined) {
    const rawCatScore = userAffinity.categoryScores[cat];
    score += Math.max(-0.15, Math.min(0.25, rawCatScore * 0.05));
  }

  // Subcategory boost (up to +0.20)
  if (userAffinity.subcategoryScores && userAffinity.subcategoryScores[sub] !== undefined) {
    const rawSubScore = userAffinity.subcategoryScores[sub];
    score += Math.max(-0.10, Math.min(0.20, rawSubScore * 0.05));
  }

  // Brand boost (up to +0.15)
  if (userAffinity.brandScores && userAffinity.brandScores[brand] !== undefined) {
    const rawBrandScore = userAffinity.brandScores[brand];
    score += Math.max(-0.10, Math.min(0.15, rawBrandScore * 0.05));
  }

  // Price match boost
  if (userAffinity.pricePreference && userAffinity.pricePreference.average > 0 && product.price) {
    const diff = Math.abs(product.price - userAffinity.pricePreference.average);
    const range = userAffinity.pricePreference.average;
    if (diff < range * 0.3) {
      score += 0.10; // close to preferred price
    } else if (diff > range * 1.5) {
      score -= 0.10; // far from preferred price
    }
  }

  return Math.max(0.0, Math.min(1.0, score));
}
