import prisma from './db.js';

const FEEDBACK_SIGNALS = {
  order:    { weight: 3.0, polarity:  1, desc: "Highest trust — user actually purchased" },
  save:     { weight: 2.0, polarity:  1, desc: "Saved to wishlist / plan — strong positive" },
  like:     { weight: 1.5, polarity:  1, desc: "Explicit thumbs-up" },
  share:    { weight: 1.2, polarity:  1, desc: "Shared the recommendation" },
  view:     { weight: 0.4, polarity:  1, desc: "Opened product details (weak signal)" },
  replace:  { weight: 1.8, polarity:  0, desc: "Swapped product A for product B" },
  remove:   { weight: 1.5, polarity: -1, desc: "Removed from cart" },
  dislike:  { weight: 1.2, polarity: -1, desc: "Explicit thumbs-down" },
  add_cat:  { weight: 1.6, polarity:  1, desc: "User requested to add a category" },
  rem_cat:  { weight: 1.6, polarity: -1, desc: "User requested to remove a category" },
  refine:   { weight: 1.3, polarity:  0, desc: "Follow-up refinement (learns tags/keywords)" },
};

const DEFAULT_PROFILE = {
  category_scores: {},
  brand_scores: {},
  tag_scores: {},
  price_sensitivity: 0.5,
  quality_bias: 0.5,
  min_rating_pref: 3.5,
  eco_soc_warm: 0.0,
  total_signals: 0,
};

const DECAY = 0.985;        // each update erodes old score slightly (freshness)
const FLOOR = -0.95;
const CEIL  =  0.95;
const _PRICE_BUCKETS = [500, 1000, 2000, 4000, 8000];

function clamp(v, min = FLOOR, max = CEIL) {
  return Math.max(min, Math.min(max, v));
}

function safeParse(obj, fallback) {
  try { return typeof obj === "string" ? JSON.parse(obj) : obj; }
  catch { return fallback; }
}

function loadProfileRow(row) {
  return {
    ...DEFAULT_PROFILE,
    category_scores: safeParse(row?.category_scores || "{}", {}),
    brand_scores:    safeParse(row?.brand_scores    || "{}", {}),
    tag_scores:      safeParse(row?.tag_scores      || "{}", {}),
    price_sensitivity: row?.price_sensitivity ?? 0.5,
    quality_bias:      row?.quality_bias      ?? 0.5,
    min_rating_pref:   row?.min_rating_pref   ?? 3.5,
    eco_soc_warm:      row?.eco_soc_warm      ?? 0.0,
    total_signals:     row?.total_signals     ?? 0,
  };
}

export class PreferenceEngine {
  constructor(userId = null) {
    this.userId = userId;
    this.profile = { ...DEFAULT_PROFILE };
    this._loaded = false;
  }

  async load() {
    if (this._loaded) return;
    if (!this.userId) {
      this._loaded = true;
      return;
    }
    const row = await prisma.learnedPreferences.findUnique({ where: { user_id: this.userId } });
    if (row) {
      this.profile = loadProfileRow(row);
    } else {
      this.profile = { ...DEFAULT_PROFILE };
    }
    this._loaded = true;
  }

  async persist() {
    if (!this.userId) return;
    const data = {
      user_id: this.userId,
      category_scores: JSON.stringify(this.profile.category_scores),
      brand_scores:    JSON.stringify(this.profile.brand_scores),
      tag_scores:      JSON.stringify(this.profile.tag_scores),
      price_sensitivity: this.profile.price_sensitivity,
      quality_bias:      this.profile.quality_bias,
      min_rating_pref:   this.profile.min_rating_pref,
      eco_soc_warm:      this.profile.eco_soc_warm,
      total_signals:     this.profile.total_signals,
    };
    await prisma.learnedPreferences.upsert({
      where: { user_id: this.userId },
      create: data,
      update: data,
    });
  }

  _updateScoreMap(map, key, deltaRaw, weight) {
    const delta = deltaRaw * weight;
    const current = map[key] ?? 0;
    map[key] = clamp(current * DECAY + delta);
  }

  _nudgeScalar(current, targetDirection, amount) {
    // targetDirection in [-1, 1]; amount is learning step
    return clamp(current + targetDirection * amount * (1 - Math.abs(current - 0.5) * 0.5), 0, 1);
  }

  _learnProduct(product, signal, polarity) {
    if (!product) return;
    const base = FEEDBACK_SIGNALS[signal] || { weight: 1.0, polarity };
    const w = base.weight * (FEEDBACK_SIGNALS[signal] ? 1 : 1);
    const pol = FEEDBACK_SIGNALS[signal] ? FEEDBACK_SIGNALS[signal].polarity : polarity;
    const _effective = pol * w * 0.08; // 8% of the signal as learning step (with polarity)

    if (product.category)  this._updateScoreMap(this.profile.category_scores, product.category, pol, w * 0.06);
    if (product.brand)     this._updateScoreMap(this.profile.brand_scores,    product.brand,    pol, w * 0.07);
    (product.tags || []).forEach(t => this._updateScoreMap(this.profile.tag_scores, t, pol, w * 0.05));

    // Price sensitivity: cheaper product liked → user is price-sensitive. Premium liked → less sensitive.
    if (product.price > 0) {
      const relInBucket = Math.min(1, product.price / 5000);
      if (pol > 0) {
        // Liked expensive product → less price sensitive. Liked cheap → more sensitive.
        this.profile.price_sensitivity = this._nudgeScalar(this.profile.price_sensitivity, 1 - relInBucket, 0.03 * w);
      } else if (pol < 0) {
        this.profile.price_sensitivity = this._nudgeScalar(this.profile.price_sensitivity, relInBucket, 0.03 * w);
      }
    }

    // Quality bias: rated highly liked → more quality bias.
    if (product.rating != null) {
      const ratingNorm = (product.rating - 3) / 2; // 3 → 0, 5 → 1
      if (pol > 0) {
        this.profile.quality_bias = this._nudgeScalar(this.profile.quality_bias, ratingNorm, 0.025 * w);
      } else if (pol < 0) {
        this.profile.quality_bias = this._nudgeScalar(this.profile.quality_bias, -ratingNorm, 0.025 * w);
      }
      if (pol > 0) {
        this.profile.min_rating_pref = clamp(this.profile.min_rating_pref * 0.92 + product.rating * 0.08 * w, 2.0, 4.8);
      }
    }

    // Hostel/socially warm cues
    const warmTags = ["hostel", "foldable", "portable", "organizer", "student"];
    const hits = (product.tags || []).filter(t => warmTags.includes(t)).length;
    if (hits > 0) {
      const nudge = 0.04 * w * hits / warmTags.length;
      this.profile.eco_soc_warm = this._nudgeScalar(this.profile.eco_soc_warm, pol > 0 ? 1 : -1, nudge);
    }

    this.profile.total_signals = (this.profile.total_signals || 0) + Math.max(1, Math.round(w));
  }

  async recordFeedback({ product, feedback_type, rating, comment, product_id, category, tags, session_id, goal_id, weight = 1.0, catalog }) {
    let productObj = product;
    if (!productObj && product_id && catalog) {
      productObj = catalog.find(p => p.id === product_id) || null;
    }
    if (!productObj && category && tags) {
      productObj = { category, tags: typeof tags === "string" ? safeParse(tags, []) : (tags || []) };
    }

    const signal = FEEDBACK_SIGNALS[feedback_type] || { weight: 1.0 * weight, polarity: rating ? (rating >= 3.5 ? 1 : -1) : 0 };
    const polarity = signal.polarity;
    this._learnProduct(productObj, feedback_type, polarity);

    // Explicit rating (1-5) overrides as stronger explicit signal
    if (rating != null && rating > 0) {
      const explicitPol = rating >= 4 ? 1 : rating <= 2 ? -1 : 0.3;
      const explicitW   = 0.5 + Math.abs(rating - 3) * 0.6; // 5/1 are strongest
      if (productObj) this._learnProduct(productObj, feedback_type + "_rated", explicitPol * explicitW);
    }

    // Persist feedback for analytics + DB log
    if (this.userId || session_id) {
      try {
        await prisma.userFeedback.create({
          data: {
            user_id: this.userId || undefined,
            session_id: session_id || undefined,
            goal_id: goal_id || undefined,
            feedback_type,
            rating: rating || undefined,
            comment: comment || undefined,
            product_id: (productObj && productObj.id) || product_id || undefined,
            category: (productObj && productObj.category) || category || undefined,
            tags: (productObj && productObj.tags) ? JSON.stringify(productObj.tags) : (tags ? JSON.stringify(tags) : undefined),
            weight: (signal.weight || 1.0) * weight,
          },
        });
      } catch (e) {
        console.warn("[PrefEngine] Failed to persist feedback:", e.message);
      }
    }

    await this.persist();
  }

  async recordInteraction({ action_type, query_text, category, product_from, product_to, session_id, metadata, catalog }) {
    // Learn from refinements: swaps, category add/remove, budget changes
    if (action_type === "swap" && product_from && product_to && catalog) {
      const fromP = catalog.find(p => p.id === product_from);
      const toP   = catalog.find(p => p.id === product_to);
      if (fromP) this._learnProduct(fromP, "replace", -1);
      if (toP)   this._learnProduct(toP,   "replace",  1);
    }
    if (action_type === "add_category" && category) {
      this._updateScoreMap(this.profile.category_scores, category, 1, FEEDBACK_SIGNALS.add_cat.weight * 0.08);
      this.profile.total_signals += 2;
    }
    if (action_type === "remove_category" && category) {
      this._updateScoreMap(this.profile.category_scores, category, -1, FEEDBACK_SIGNALS.rem_cat.weight * 0.08);
      this.profile.total_signals += 2;
    }
    if (action_type === "refine_request" && query_text) {
      const tokens = (query_text.toLowerCase().match(/[a-z0-9]+/g) || []);
      tokens.forEach(tok => {
        if (tok.length >= 4) {
          this._updateScoreMap(this.profile.tag_scores, tok, 1, FEEDBACK_SIGNALS.refine.weight * 0.03);
        }
      });
      this.profile.total_signals += 1;
    }

    if (this.userId || session_id) {
      try {
        await prisma.interactionHistory.create({
          data: {
            user_id: this.userId || undefined,
            session_id: session_id || undefined,
            action_type,
            query_text: query_text || undefined,
            category: category || undefined,
            product_from: product_from || undefined,
            product_to: product_to || undefined,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
          },
        });
      } catch (e) {
        console.warn("[PrefEngine] Failed to persist interaction:", e.message);
      }
    }

    await this.persist();
  }

  /**
   * Score a product using learned preferences.
   * Returns number in roughly [-1.2, 1.2]; higher = more aligned with user tastes.
   */
  scoreProduct(product) {
    if (!product) return 0;
    const { category_scores, brand_scores, tag_scores, price_sensitivity, quality_bias, min_rating_pref } = this.profile;
    const catW = category_scores[product.category] ?? 0;
    const brW  = brand_scores[product.brand] ?? 0;
    const tagW = product.tags ? product.tags.reduce((acc, t) => acc + (tag_scores[t] ?? 0), 0) / Math.max(1, product.tags.length) : 0;

    let pricePenalty = 0;
    if (product.price > 0 && price_sensitivity > 0.4) {
      // If user is price sensitive, expensive items get a penalty
      const priceNorm = Math.min(1, product.price / 4000);
      pricePenalty = -priceNorm * (price_sensitivity - 0.4) * 1.2;
    } else if (price_sensitivity < 0.35 && product.price > 1500) {
      const priceNorm = Math.min(1, product.price / 4000);
      pricePenalty = priceNorm * (0.35 - price_sensitivity) * 0.9;
    }

    let qualityBoost = 0;
    if (product.rating != null) {
      const belowMin = Math.max(0, min_rating_pref - product.rating);
      if (belowMin > 0) qualityBoost = -belowMin * 0.6;
      else qualityBoost = (product.rating - min_rating_pref) * 0.08 * quality_bias + (product.rating - 3.5) * 0.06;
      const reviewsBoost = Math.min(1, (product.reviews || 0) / 2000) * 0.08;
      qualityBoost += reviewsBoost;
    }

    const hostelry = this.profile.eco_soc_warm || 0;
    const warmTags = ["hostel", "foldable", "portable", "organizer", "student", "compact"];
    const warmHits = (product.tags || []).filter(t => warmTags.includes(t)).length / warmTags.length;
    const warmBoost = hostelry * warmHits * 0.35;

    // Components sum roughly in [-1.2, 1.2]
    return (
      catW * 0.35 +
      brW  * 0.22 +
      tagW * 0.32 +
      pricePenalty +
      qualityBoost +
      warmBoost
    );
  }

  rerankProducts(products, baseScoreFn = null) {
    if (!this._loaded) return products;
    return products.map(p => {
      const prefScore = this.scoreProduct(p);
      const base = baseScoreFn ? baseScoreFn(p) : ((((p.rating || 3.5) - 3) / 2) * 0.25 + Math.min(1, (p.reviews || 0) / 2000) * 0.15);
      // Blend: 45% learned preferences, 55% base (rating/reviews etc). As signals grow, pref weight grows.
      const learnStrength = Math.min(0.65, 0.25 + 0.05 * Math.sqrt(this.profile.total_signals || 0));
      const finalScore = prefScore * learnStrength + base * (1 - learnStrength);
      return { product: p, finalScore, prefScore, baseScore: base };
    })
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(r => r.product);
  }

  filterByTaste(products, softDropThreshold = -0.6) {
    if (!this._loaded || this.profile.total_signals < 3) return products;
    return products.filter(p => this.scoreProduct(p) >= softDropThreshold);
  }

  getInsights() {
    const topCats = Object.entries(this.profile.category_scores).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topBrands = Object.entries(this.profile.brand_scores).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topTags = Object.entries(this.profile.tag_scores).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      signals: this.profile.total_signals,
      top_categories: topCats.map(([k, v]) => ({ name: k, score: +v.toFixed(3) })),
      top_brands:     topBrands.map(([k, v]) => ({ name: k, score: +v.toFixed(3) })),
      top_tags:       topTags.map(([k, v]) => ({ name: k, score: +v.toFixed(3) })),
      price_sensitivity: +this.profile.price_sensitivity.toFixed(3),
      quality_bias:      +this.profile.quality_bias.toFixed(3),
      min_rating_pref:   +this.profile.min_rating_pref.toFixed(2),
      eco_soc_warm:      +this.profile.eco_soc_warm.toFixed(3),
    };
  }
}

export default PreferenceEngine;
