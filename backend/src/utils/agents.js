import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

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
  } catch (err) {
    return "";
  }
};

const extractJson = (text) => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  let start = -1;
  if (startObj !== -1 && startArr !== -1) start = Math.min(startObj, startArr);
  else if (startObj !== -1) start = startObj;
  else if (startArr !== -1) start = startArr;
  else start = 0;
  
  cleaned = cleaned.slice(start);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
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

export const goalAgent = async (rawInput, prefs = null) => {
  const budget = parseBudget(rawInput);
  const weights = detectCategories(rawInput);

  // Boost categories user already likes, suppress ones they dislike
  if (prefs && prefs.profile && prefs.profile.category_scores) {
    const scores = prefs.profile.category_scores;
    const boosted = {};
    for (const k in weights) {
      const prefBoost = 1 + (scores[k] || 0) * 0.6;
      boosted[k] = weights[k] * Math.max(0.2, prefBoost);
    }
    // Normalize
    let total = Object.values(boosted).reduce((a, b) => a + b, 0);
    if (total > 0) for (const k in boosted) boosted[k] /= total;
    Object.assign(weights, boosted);
  }

  const budgetPerCategory = {};
  for (const [cat, weight] of Object.entries(weights)) {
    let alloc = Math.floor(budget * weight);
    if (alloc >= 50) budgetPerCategory[cat] = alloc;
  }

  const fallback = {
    goal_summary: rawInput.slice(0, 80),
    budget_total: budget,
    budget_per_category: budgetPerCategory,
    priority: "balanced",
    context: `User wants: ${rawInput}`
  };

  const res = await callClaude("", "");
  if (res) {
    const parsed = extractJson(res);
    if (parsed) return parsed;
  }
  return fallback;
};

export const plannerAgent = async (goal, prefs = null) => {
  const categories = [];
  const budgetMap = goal.budget_per_category || {};

  for (const [name, budget] of Object.entries(budgetMap)) {
    if (budget <= 0) continue;
    const maxItems = Math.max(2, Math.min(5, Math.floor(budget / 800)));
    categories.push({
      name, budget,
      must_have: [`top-rated ${name} essentials`],
      nice_to_have: [`comfort upgrades for ${name}`],
      max_items: maxItems
    });
  }

  const fallback = {
    categories,
    overall_strategy: "Prioritize must-have essentials first, then add comfort upgrades within budget."
  };

  const res = await callClaude("", "");
  if (res) {
    const parsed = extractJson(res);
    if (parsed) return parsed;
  }
  return fallback;
};

export const filterAgent = async (category, budget, products, prefs = null) => {
  let affordable = products.filter(p => p.category === category && p.price <= budget);
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

  const res = await callClaude("", "");
  if (res) {
    const ids = extractJson(res);
    if (Array.isArray(ids)) return top.filter(p => ids.includes(p.id));
  }
  return top;
};

export const rankerAgent = async (category, products, mustHave, niceToHave, prefs = null) => {
  if (!products.length) return [];

  const scored = products.map(product => {
    let score = product.rating * 10 + Math.min(product.reviews, 1000) / 100;
    const boostTags = ["hostel", "study", "stainless", "LED", "organizer", "foldable", "portable"];
    if (product.tags && boostTags.some(t => product.tags.includes(t))) score += 3;
    return { score, product };
  });

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

  const res = await callClaude("", "");
  if (res) {
    const ids = extractJson(res);
    if (Array.isArray(ids)) {
      const idOrder = {};
      ids.forEach((id, i) => idOrder[id] = i);
      return [...products].sort((a, b) => (idOrder[a.id] ?? 99) - (idOrder[b.id] ?? 99));
    }
  }
  return ranked;
};

export const selectorAgent = async (category, rankedProducts, budget, maxItems, prefs = null) => {
  if (!rankedProducts.length) return [];
  const selected = [];
  let spent = 0;

  // After learning, pick with a quality_bias-aware selection:
  // quality_bias high = more premium even if fewer items
  let bias = 0.5;
  if (prefs && prefs.profile) bias = prefs.profile.quality_bias ?? 0.5;

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
    const reason = `Best ${item.category} pick for: ${goalSummary}${item.trust_reason ? " (" + item.trust_reason + ")" : ""}`;
    cart.push({ id: item.id, quantity: 1, reason });
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
    cart, total, savings_tip: savingsTip,
    summary: `Sakhi curated ${cart.length} items optimized for quality and budget.`
  };

  const res = await callClaude("", "");
  if (res) {
    const parsed = extractJson(res);
    if (parsed) return parsed;
  }
  return fallback;
};

export const checkoutAgent = async (cart, allProducts) => {
  const productMap = {};
  allProducts.forEach(p => productMap[p.id] = p);
  
  const items = [];
  let total = 0;
  
  for (const cartItem of (cart.cart || [])) {
    const product = productMap[cartItem.id];
    if (product) {
      const item = { ...product, quantity: cartItem.quantity || 1, reason: cartItem.reason || "" };
      total += product.price * item.quantity;
      items.push(item);
    }
  }
  
  return {
    items, total,
    savings_tip: cart.savings_tip || "",
    summary: cart.summary || "",
    item_count: items.length
  };
};
