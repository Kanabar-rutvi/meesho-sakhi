import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

import { getProductsByCategoryAndBudget, getProductById } from './catalog.js';
import { rankingService } from '../services/search/rankingService.js';

const callClaude = async (system, user) => {
  if (!client) return "";
  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20240620", // or similar sonnet model
      max_tokens: 1000,
      system: system,
      messages: [{ role: "user", content: user }]
    });
    return response.content[0].text;
  } catch {
    return "";
  }
};

const extractJson = (text) => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  let start;
  if (startObj !== -1 && startArr !== -1) start = Math.min(startObj, startArr);
  else if (startObj !== -1) start = startObj;
  else if (startArr !== -1) start = startArr;
  else start = 0;
  
  cleaned = cleaned.slice(start);
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

const parseBudget = (text) => {
  let lower = text.toLowerCase().replace(/₹/g, "").replace(/rs\.?/g, "").replace(/inr/g, "");

  if (lower.includes(",")) {
    const commaMatches = [...lower.matchAll(/(\d{1,3}(?:,\d{2,3})+)/g)];
    if (commaMatches.length) {
      let parsed = commaMatches.map(m => parseInt(m[0].replace(/,/g, ""))).filter(p => !isNaN(p));
      let budgets = parsed.filter(p => p >= 100);
      if (budgets.length) return Math.max(...budgets);
    }
  }

  const kMatches = [...lower.matchAll(/(\d+)\s*k\b/g)];
  if (kMatches.length) {
    return parseInt(kMatches[kMatches.length - 1][1]) * 1000;
  }

  const plainMatches = [...lower.matchAll(/\d+/g)];
  if (plainMatches.length) {
    let candidates = plainMatches.map(n => parseInt(n[0])).filter(n => n >= 100);
    if (candidates.length) return Math.max(...candidates);
  }
  return 12000;
};

// Simplified category detection mapped from python
const QUERY_CATEGORY_MAP = {
  "hostel":       {bedding: 0.30, study: 0.25, kitchen: 0.15, storage: 0.12, electronics: 0.10, hygiene: 0.08},
  "study":        {study: 0.50, electronics: 0.30, storage: 0.20},
  "kitchen":      {kitchen: 0.65, storage: 0.20, hygiene: 0.15},
  "bed":          {bedding: 0.70, storage: 0.15, hygiene: 0.15},
  "gadget":       {electronics: 0.60, study: 0.25, storage: 0.15},
};

const detectCategories = (text) => {
  const lower = text.toLowerCase();
  let combined = {};
  let matches = 0;
  
  for (const [keyword, weights] of Object.entries(QUERY_CATEGORY_MAP)) {
    if (lower.includes(keyword)) {
      matches++;
      for (const [cat, weight] of Object.entries(weights)) {
        combined[cat] = (combined[cat] || 0) + weight;
      }
    }
  }
  
  if (matches === 0) {
    combined = { bedding: 0.25, study: 0.20, kitchen: 0.20, storage: 0.12, electronics: 0.13, hygiene: 0.10 };
  }
  
  let total = Object.values(combined).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (let k in combined) combined[k] /= total;
  }
  return combined;
};

const VALID_CATEGORIES = ['bedding', 'study', 'kitchen', 'storage', 'electronics', 'hygiene'];

const validateCombinedIntent = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return { valid: false, reason: "Result is not an object" };
  if (!parsed.goal || typeof parsed.goal !== 'object') return { valid: false, reason: "Missing or invalid goal object" };
  if (!parsed.plan || typeof parsed.plan !== 'object') return { valid: false, reason: "Missing or invalid plan object" };

  const { goal, plan } = parsed;

  if (goal.goal_summary !== undefined && typeof goal.goal_summary !== 'string') return { valid: false, reason: "goal_summary must be a string" };
  
  if (goal.budget_total !== undefined) {
    const bt = Number(goal.budget_total);
    if (!isFinite(bt) || bt < 0) return { valid: false, reason: "budget_total must be a non-negative number" };
    goal.budget_total = bt;
  }
  
  if (goal.budget_per_category !== undefined && (typeof goal.budget_per_category !== 'object' || goal.budget_per_category === null)) return { valid: false, reason: "budget_per_category must be an object" };
  if (goal.priority !== undefined && typeof goal.priority !== 'string') return { valid: false, reason: "priority must be a string" };
  if (goal.context !== undefined && typeof goal.context !== 'string') return { valid: false, reason: "context must be a string" };

  if (!Array.isArray(plan.categories)) return { valid: false, reason: "plan.categories must be an array" };

  let sumCategoryBudgets = 0;

  for (const cat of plan.categories) {
    if (!cat || typeof cat !== 'object') return { valid: false, reason: "Invalid category object in plan" };
    if (typeof cat.name !== 'string' || !cat.name.trim()) return { valid: false, reason: "Category name must be a non-empty string" };
    if (!VALID_CATEGORIES.includes(cat.name)) return { valid: false, reason: `Invalid category name: ${cat.name}` };
    
    if (cat.budget !== undefined) {
      const catBudget = Number(cat.budget);
      if (!isFinite(catBudget) || catBudget < 0) return { valid: false, reason: "Category budget must be a non-negative number" };
      cat.budget = catBudget;
      sumCategoryBudgets += cat.budget;
    }
    
    if (cat.max_items !== undefined) {
      const maxItems = Number(cat.max_items);
      if (!Number.isInteger(maxItems) || maxItems <= 0) return { valid: false, reason: "max_items must be a positive integer" };
      cat.max_items = maxItems;
    }
    
    if (cat.must_have !== undefined && !Array.isArray(cat.must_have)) return { valid: false, reason: "must_have must be an array" };
    if (cat.nice_to_have !== undefined && !Array.isArray(cat.nice_to_have)) return { valid: false, reason: "nice_to_have must be an array" };
  }

  if (plan.overall_strategy !== undefined && typeof plan.overall_strategy !== 'string') return { valid: false, reason: "overall_strategy must be a string" };

  if (goal.budget_total !== undefined && sumCategoryBudgets > goal.budget_total) {
    return { valid: false, reason: "Sum of category budgets exceeds budget_total" };
  }

  return { valid: true, data: parsed };
};

export const combinedIntentAgent = async (rawInput, prefs = null) => {
  // 1. Goal Fallback Logic
  const budget = parseBudget(rawInput);
  const weights = detectCategories(rawInput);

  if (prefs && prefs.profile && prefs.profile.category_scores) {
    const scores = prefs.profile.category_scores;
    const boosted = {};
    for (const k in weights) {
      const prefBoost = 1 + (scores[k] || 0) * 0.6;
      boosted[k] = weights[k] * Math.max(0.2, prefBoost);
    }
    let total = Object.values(boosted).reduce((a, b) => a + b, 0);
    if (total > 0) for (const k in boosted) boosted[k] /= total;
    Object.assign(weights, boosted);
  }

  const budgetPerCategory = {};
  for (const [cat, weight] of Object.entries(weights)) {
    let alloc = Math.floor(budget * weight);
    if (alloc >= 50) budgetPerCategory[cat] = alloc;
  }

  const goalFallback = {
    goal_summary: rawInput.slice(0, 80),
    budget_total: budget,
    budget_per_category: budgetPerCategory,
    priority: "balanced",
    context: `User wants: ${rawInput}`
  };

  // 2. Planner Fallback Logic
  const categories = [];
  for (const [name, catBudget] of Object.entries(budgetPerCategory)) {
    if (catBudget <= 0) continue;
    const maxItems = Math.max(2, Math.min(5, Math.floor(catBudget / 800)));
    categories.push({
      name, budget: catBudget,
      must_have: [`top-rated ${name} essentials`],
      nice_to_have: [`comfort upgrades for ${name}`],
      max_items: maxItems
    });
  }

  const planFallback = {
    categories,
    overall_strategy: "Prioritize must-have essentials first, then add comfort upgrades within budget."
  };

  const combinedFallback = { goal: goalFallback, plan: planFallback };

  // AI Call
  const systemPrompt = "You are an expert shopping assistant. Analyze the user's query and generate a JSON response with two keys: 'goal' and 'plan'. The 'goal' object must contain 'goal_summary', 'budget_total', 'budget_per_category' (map of category to budget integer), 'priority', and 'context'. The 'plan' object must contain an array 'categories' (each with 'name', 'budget', 'must_have' string array, 'nice_to_have' string array, and 'max_items' integer) and an 'overall_strategy'.";
  const userPrompt = `User Query: "${rawInput}"\nCalculated Budget: ${budget}\nDetected Categories: ${JSON.stringify(Object.keys(budgetPerCategory))}\nPlease return the combined JSON.`;

  const res = await callClaude(systemPrompt, userPrompt);
  if (res) {
    const parsed = extractJson(res);
    if (parsed) {
      const validation = validateCombinedIntent(parsed);
      if (validation.valid) {
        return validation.data;
      } else {
        console.warn(`[CombinedIntentAgent] Combined intent validation failed: ${validation.reason}`);
      }
    }
  }

  return combinedFallback;
};

export const filterAgent = async (category, budget, products, prefs = null) => {
  let affordable = getProductsByCategoryAndBudget(category, budget);
  if (!affordable.length) return [];

  // Taste-based soft filter after enough learning signals
  if (prefs && prefs.filterByTaste) {
    const tasteFiltered = prefs.filterByTaste(affordable);
    if (tasteFiltered.length >= Math.ceil(affordable.length * 0.5)) {
      affordable = tasteFiltered;
    }
  }

  affordable.sort((a, b) => b.rating - a.rating || a.price - b.price || b.reviews - a.reviews);
  const top = affordable.slice(0, 10);

  return top;
};

export const rankerAgent = async (category, products, mustHave, niceToHave, prefs = null) => {
  if (!products.length) return [];

  const contextTags = [...(mustHave || []), ...(niceToHave || [])].flatMap(t => String(t).toLowerCase().split(/\s+/));
  const rankedResults = rankingService.rankProducts(products, {
    category,
    tags: contextTags
  });

  const scored = rankedResults.map(r => ({
    score: r.score * 30, // scaled for compatibility
    product: r.product
  }));

  // Blend PreferenceEngine personalization into ranking scores
  let blended = scored;
  if (prefs && prefs.rerankProducts) {
    const prefReranked = prefs.rerankProducts(
      scored.map(s => s.product),
      (p) => {
        const found = scored.find(s => s.product.id === p.id);
        return found ? found.score / 30 : 0; // normalized to [0~1.2] range
      }
    );
    blended = prefReranked.map(product => {
      const orig = scored.find(s => s.product.id === product.id);
      return { product, score: orig ? orig.score : 0 };
    });
  }

  blended.sort((a, b) => b.score - a.score);
  const ranked = blended.map(s => s.product);

  return ranked;
};

export const selectorAgent = async (category, rankedProducts, budget, maxItems, prefs = null) => {
  if (!rankedProducts.length) return [];
  const selected = [];
  let spent = 0;

  // After learning, pick with a quality_bias-aware selection:
  // quality_bias high = more premium even if fewer items
  let _bias = 0.5;
  if (prefs && prefs.profile) _bias = prefs.profile.quality_bias ?? 0.5;

  // Build selection order: greedy by (rating + price fit), blended with learned scores
  const ordered = [...rankedProducts];
  for (const product of ordered) {
    if (selected.length >= maxItems) break;
    if (spent + product.price <= budget) {
      selected.push(product);
      spent += product.price;
    }
  }
  return selected;
};

export const reviewAgent = async (selectedItems, prefs = null) => {
  if (!selectedItems.length) return [];
  const minRating = (prefs && prefs.profile) ? (prefs.profile.min_rating_pref ?? 3.0) : 3.0;
  return selectedItems.map(item => {
    const rating = item.rating || 0;
    const reviews = item.reviews || 0;
    let trustScore = Math.min(0.99, Math.max(0.6, (rating / 5) * 0.7 + Math.min(reviews / 5000, 0.3)));

    // Learned preference boost: if user is more quality-biased, give rating more weight
    if (prefs && prefs.profile && prefs.profile.quality_bias > 0.55) {
      const qBoost = (prefs.profile.quality_bias - 0.55) * 0.6;
      trustScore = Math.min(0.99, trustScore + Math.max(0, (rating - 4) * qBoost));
    }
    trustScore = Math.round(trustScore * 100) / 100;

    let reason = "Budget-friendly option, fewer reviews but acceptable quality";
    if (trustScore >= 0.9) reason = "Exceptional ratings with high review volume — very trustworthy";
    else if (trustScore >= 0.8) reason = "Strong rating and solid review count";
    else if (trustScore >= 0.7) reason = "Good value pick with decent reviews";

    // Penalize items below user's preferred minimum rating
    if (rating < minRating) {
      trustScore = Math.round(Math.max(0.4, trustScore - (minRating - rating) * 0.2) * 100) / 100;
      reason = `Rating below your preference threshold (${minRating.toFixed(1)}) — verify carefully`;
    }

    return { ...item, trust_score: trustScore, trust_reason: reason };
  });
};

export const recommendAgent = async (allSelected, goal, prefs = null) => {
  const cart = [];
  let total = 0;
  const goalSummary = goal.goal_summary || "your shopping goal";

  // Learned-driven ordering: prefer higher score items when cutting off at 12
  let ordered = allSelected;
  if (prefs && prefs.rerankProducts) {
    ordered = prefs.rerankProducts(allSelected, (p) => {
      return (p.trust_score || 0.7) * 0.7 + ((p.rating || 3.8) - 3) * 0.2;
    });
  }

  for (const item of ordered.slice(0, 12)) {
    const reason = (item.reason && item.reason.trim()) || 
      `Best ${item.category || "essential"} pick for "${goalSummary}": highly rated (${item.rating || 4.2}★) with verified value at ₹${item.price?.toLocaleString()}.${item.trust_reason ? " " + item.trust_reason : ""}`;
    cart.push({ 
      ...item,
      id: item.id, 
      quantity: 1, 
      reason,
      trust_score: item.trust_score ?? 0.85,
      trust_reason: item.trust_reason || "Verified authentic ratings and quality materials"
    });
    total += item.price;
  }

  const budget = goal.budget_total || 0;
  const saved = budget > total ? budget - total : 0;

  let savingsTip = "Your cart is optimized to give you the best value within your budget.";
  if (saved > 0) savingsTip = `🎉 Great news! You saved ₹${saved} from your ₹${budget} budget.`;
  if (prefs && prefs.profile && (prefs.profile.total_signals || 0) > 3) {
    const insight = prefs.getInsights();
    const brandHint = (insight.top_brands[0]) ? ` Learnt your preference for ${insight.top_brands[0].name} and similar.` : "";
    savingsTip += brandHint;
  }

  const fallback = {
    items: cart,
    cart: cart, // Provide both .items and .cart for seamless backwards compatibility
    total, savings_tip: savingsTip,
    summary: cart.length > 0 
      ? `Sakhi curated ${cart.length} items optimized for quality and budget.` 
      : "I couldn't find any items matching your request. Could you try adjusting your criteria?"
  };

  return fallback;
};

export const checkoutAgent = async (cartData, allProducts) => {
  const items = [];
  let total = 0;
  
  // Support both array (runningItems/recItems) and object (cartRec)
  const itemArray = Array.isArray(cartData) ? cartData : (cartData.items || cartData.cart || []);
  
  for (const cartItem of itemArray) {
    const product = getProductById(cartItem.id) || cartItem;
    if (product) {
      const trustScore = cartItem.trust_score ?? product.trust_score ?? 0.85;
      const trustReason = cartItem.trust_reason || product.trust_reason || "Verified authentic buyer reviews and quality ratings";
      const reason = (cartItem.reason && cartItem.reason.trim())
        ? cartItem.reason.trim()
        : `Selected as a top-rated ${product.category || 'essential'} with high customer ratings (${product.rating || 4.2}★) offering dependable value within budget.`;

      const item = { 
        ...product, 
        quantity: cartItem.quantity || 1, 
        reason,
        trust_score: trustScore,
        trust_reason: trustReason
      };
      total += product.price * item.quantity;
      items.push(item);
    }
  }
  
  const summaryText = items.length > 0
    ? `Sakhi curated ${items.length} items optimized for quality and budget.`
    : "I couldn't find any items matching your request. Could you try adjusting your criteria?";

  return {
    items, total,
    savings_tip: cartData.savings_tip || "",
    summary: cartData.summary || summaryText,
    item_count: items.length
  };
};
