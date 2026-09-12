/**
 * Recommendation Service
 *
 * Two operating modes:
 *   MODE 1 — deterministic: scoring via productRankingService
 *   MODE 2 — ml:            scoring via mlRecommendationModel (falls back to deterministic)
 *
 * Cold-start strategy:
 *   New users (insufficient history) → query relevance + quality + popularity
 *   Returning users                  → above + personalised preference signals
 *
 * This service does NOT call Claude. Zero LLM calls.
 */

import { rankProducts, scoreProduct } from './productRankingService.js';
import { predict } from './mlRecommendationModel.js';

/**
 * Recommend products from a candidate list.
 *
 * @param {object} options
 * @param {object[]}     options.products     - candidates from productSearchService
 * @param {object}       [options.criteria]   - search criteria (query, category, etc.)
 * @param {object}       [options.features]   - user feature vector from extractFeatures()
 * @param {string}       [options.mode]       - "deterministic" | "ml" (default: "ml" with fallback)
 * @param {number}       [options.limit]      - max results
 *
 * @returns {{ products: object[], scores: number[], source: string, explanation: string }}
 */
export function recommendProducts({ products = [], criteria = {}, features = null, mode = 'ml', limit = 10 } = {}) {
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return _empty('No candidate products supplied.');
    }

    const clampedLimit = Math.min(Math.max(limit, 1), 100);

    // ── MODE 2: ML attempt ──────────────────────────────────────────────────
    if (mode === 'ml' && features) {
      const mlResult = _tryMlRecommendation(products, features, criteria, clampedLimit);
      if (mlResult) return mlResult;
      // Fall through to deterministic
    }

    // ── MODE 1: Deterministic ───────────────────────────────────────────────
    return _deterministicRecommendation(products, criteria, features, clampedLimit);

  } catch (err) {
    console.error('[recommendationService] recommendProducts() error:', err.message);
    // Safe fallback: return raw products up to limit, no crash
    return {
      products: products.slice(0, 10),
      scores:   products.slice(0, 10).map(() => 0),
      source:   'fallback',
      explanation: 'Recommendation service error — returning unranked candidates.'
    };
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function _tryMlRecommendation(products, features, criteria, limit) {
  try {
    const mlResult = predict(features, products);
    if (!mlResult || !Array.isArray(mlResult.scores) || mlResult.scores.length !== products.length) {
      return null; // model unavailable or bad output
    }

    const paired = products.map((p, i) => ({ product: p, score: mlResult.scores[i] }));
    paired.sort((a, b) => b.score - a.score);
    const top = paired.slice(0, limit);

    return {
      products:    top.map(x => x.product),
      scores:      top.map(x => x.score),
      source:      'ml',
      explanation: `ML model (${mlResult.source || 'unknown'}) ranked ${products.length} candidates.`
    };
  } catch {
    return null;
  }
}

function _deterministicRecommendation(products, criteria, features, limit) {
  const isNewUser = !features || features.isNewUser;

  // Build enriched criteria by merging user features
  const enrichedCriteria = { ...criteria };
  if (features && !isNewUser) {
    // Boost preferred tags if no tags specified in original query
    if (!enrichedCriteria.tags && features.preferredTags?.length > 0) {
      enrichedCriteria.tags = features.preferredTags.slice(0, 3);
    }
  }

  const ranked = rankProducts(products, enrichedCriteria);
  const top    = ranked.slice(0, limit);

  const source = isNewUser ? 'deterministic_cold_start' : 'deterministic_personalised';
  const explanation = isNewUser
    ? `Cold-start: ranked ${products.length} products by quality + relevance (no user history).`
    : `Personalised: ranked ${products.length} products using preference signals + relevance.`;

  return {
    products:    top.map(x => x.product),
    scores:      top.map(x => Math.round(x.score * 1000) / 1000),
    source,
    explanation
  };
}

function _empty(reason) {
  return { products: [], scores: [], source: 'empty', explanation: reason };
}
