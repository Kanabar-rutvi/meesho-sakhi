/**
 * Product Ranking Service
 *
 * Deterministic relevance scoring for product search results.
 * Does NOT replace or modify the existing rankerAgent in agents.js.
 * This service is used by productSearchService and recommendationService.
 *
 * FUTURE: Replace score weights with learned model outputs (ML layer).
 */

const WEIGHTS = {
  rating:      0.25,
  reviews:     0.10,
  relevance:   0.25,
  priceFit:    0.15,
  popularity:  0.10,
  trust:       0.15,
};

const MAX_REVIEWS = 5000; // normalisation ceiling

/**
 * Score a single product against search criteria.
 * Returns a normalised float in [0, 1].
 *
 * @param {object} product
 * @param {object} criteria  - { query, category, subcategory, tags, maxPrice, minPrice }
 * @returns {number} score in [0, 1]
 */
export function scoreProduct(product, criteria = {}) {
  // ── Rating score (0–1) ─────────────────────────────────────────────────────
  const ratingScore = Math.min((product.rating || 0) / 5, 1);

  // ── Review count score (0–1, log-damped) ──────────────────────────────────
  const reviews = Math.min(product.reviews || 0, MAX_REVIEWS);
  const reviewScore = reviews / MAX_REVIEWS;

  // ── Relevance score: keyword + tag matching ────────────────────────────────
  let relevanceScore = 0;
  if (criteria.query) {
    const q = criteria.query.toLowerCase();
    const name  = (product.name  || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const tags  = (product.tags  || []).map(t => t.toLowerCase());
    if (name.includes(q))  relevanceScore += 0.5;
    if (brand.includes(q)) relevanceScore += 0.2;
    if (tags.some(t => t.includes(q))) relevanceScore += 0.3;
    relevanceScore = Math.min(relevanceScore, 1);
  }
  if (criteria.tags && Array.isArray(criteria.tags) && criteria.tags.length > 0) {
    const pTags = (product.tags || []).map(t => t.toLowerCase());
    const matched = criteria.tags.filter(t => pTags.includes(t.toLowerCase())).length;
    relevanceScore = Math.min(relevanceScore + (matched / criteria.tags.length) * 0.5, 1);
  }
  if (criteria.category && product.category === criteria.category) relevanceScore = Math.min(relevanceScore + 0.2, 1);
  if (criteria.subcategory && product.subcategory === criteria.subcategory) relevanceScore = Math.min(relevanceScore + 0.3, 1);

  // ── Price fit score (0–1, best when close to ceiling) ─────────────────────
  let priceFitScore = 0.5; // neutral when no budget given
  const budget = criteria.maxPrice;
  if (budget && budget > 0 && product.price > 0) {
    if (product.price <= budget) {
      priceFitScore = 1 - (product.price / budget) * 0.5; // cheaper → slightly better
    } else {
      priceFitScore = 0; // over budget
    }
  }

  // ── Popularity score from reviews + rating combo ───────────────────────────
  const popularityScore = Math.min(
    (reviewScore * 0.6) + (ratingScore * 0.4),
    1
  );

  // ── Trust score from rating + brand presence ───────────────────────────────
  const hasBrand = product.brand && product.brand !== 'Unknown';
  const trustScore = Math.min(
    ratingScore * 0.7 + (hasBrand ? 0.3 : 0),
    1
  );

  const total =
    ratingScore    * WEIGHTS.rating    +
    reviewScore    * WEIGHTS.reviews   +
    relevanceScore * WEIGHTS.relevance +
    priceFitScore  * WEIGHTS.priceFit  +
    popularityScore* WEIGHTS.popularity+
    trustScore     * WEIGHTS.trust;

  return Math.min(Math.max(total, 0), 1);
}

/**
 * Rank a list of products against criteria, returning them sorted by score.
 *
 * @param {object[]} products
 * @param {object}   criteria
 * @returns {{ product: object, score: number }[]}  sorted descending
 */
export function rankProducts(products, criteria = {}) {
  if (!Array.isArray(products) || products.length === 0) return [];
  return products
    .map(p => ({ product: p, score: scoreProduct(p, criteria) }))
    .sort((a, b) => b.score - a.score);
}
