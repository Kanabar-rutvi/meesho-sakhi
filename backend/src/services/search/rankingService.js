/**
 * ML / Hybrid Ranking Service
 *
 * Provides configurable multi-factor relevance ranking independent of Claude.
 * Combines semantic vector similarity, attribute matching, category alignment,
 * price fit, rating, popularity, and visual similarity into a normalized score [0, 1].
 */

export const DEFAULT_RANKING_WEIGHTS = {
  semanticSimilarity: 0.30,
  attributeMatch:     0.20,
  categoryMatch:      0.15,
  priceFit:           0.10,
  ratingScore:        0.10,
  popularityScore:    0.05,
  imageSimilarity:    0.10
};

export class RankingService {
  constructor(weights = {}) {
    this.weights = { ...DEFAULT_RANKING_WEIGHTS, ...weights };
  }

  /**
   * Calculate relevance score for a single product against search context
   * @param {object} product
   * @param {object} context
   * @param {number} [context.semanticSimilarity=0.5]
   * @param {number} [context.imageSimilarity=0.5]
   * @param {string} [context.category]
   * @param {string} [context.subcategory]
   * @param {number} [context.maxPrice]
   * @param {number} [context.minPrice]
   * @param {object} [context.attributes]
   * @param {string[]} [context.tags]
   * @param {string} [context.query]
   * @returns {{ score: number, breakdown: object }}
   */
  scoreProduct(product, context = {}) {
    // 1. Semantic Similarity [0, 1]
    const semanticSimilarity = context.semanticSimilarity !== undefined ? context.semanticSimilarity : 0.5;

    // 2. Attribute Match [0, 1]
    let attributeScore = 0.5;
    if (context.attributes && Object.keys(context.attributes).length > 0) {
      let matched = 0;
      let total = 0;
      for (const [k, v] of Object.entries(context.attributes)) {
        total++;
        if (product.attributes && String(product.attributes[k]).toLowerCase() === String(v).toLowerCase()) {
          matched++;
        }
      }
      attributeScore = total > 0 ? (matched / total) : 0.5;
    } else if (context.tags && context.tags.length > 0) {
      const pTags = (product.tags || []).map(t => String(t).toLowerCase());
      const matched = context.tags.filter(t => pTags.includes(String(t).toLowerCase())).length;
      attributeScore = Math.min(1.0, 0.4 + (matched / context.tags.length) * 0.6);
    } else if (context.query) {
      const qTokens = context.query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 1);
      if (qTokens.length > 0) {
        const prodName = (product.name || '').toLowerCase();
        const prodTags = (product.tags || []).map(t => String(t).toLowerCase());
        const prodSub = (product.subcategory || '').toLowerCase();
        let exactMatches = 0;
        for (const token of qTokens) {
          if (prodName.includes(token)) exactMatches += 1.0;
          else if (prodTags.some(t => t.includes(token)) || prodSub.includes(token)) exactMatches += 0.6;
        }
        attributeScore = Math.min(1.0, Math.max(0.2, exactMatches / qTokens.length));
      }
    }

    // 3. Category Match [0, 1]
    let categoryScore = 0.5;
    if (context.category) {
      const targetCat = context.category.toLowerCase();
      const pCat = (product.category || '').toLowerCase();
      const pOrig = (product.originalCategory || '').toLowerCase();
      if (pCat === targetCat || pOrig === targetCat) {
        categoryScore = 1.0;
        if (context.subcategory && product.subcategory) {
          categoryScore = (product.subcategory.toLowerCase() === context.subcategory.toLowerCase()) ? 1.0 : 0.85;
        }
      } else if (pCat.includes(targetCat) || targetCat.includes(pCat)) {
        categoryScore = 0.75;
      } else {
        categoryScore = 0.1;
      }
    }

    // 4. Price Fit [0, 1]
    let priceFitScore = 0.5;
    const maxBudget = context.maxPrice !== undefined ? context.maxPrice : context.budget;
    if (maxBudget && maxBudget > 0) {
      if (product.price <= maxBudget) {
        // Affordable items close to budget or reasonable saving score higher
        const ratio = product.price / maxBudget;
        priceFitScore = Math.min(1.0, 0.7 + (1 - ratio) * 0.3);
      } else {
        // Penalty for exceeding budget
        const overRatio = (product.price - maxBudget) / maxBudget;
        priceFitScore = Math.max(0, 0.5 - overRatio * 0.8);
      }
    }

    // 5. Rating Score [0, 1]
    const ratingScore = Math.min(1.0, Math.max(0, (product.rating || 0) / 5.0));

    // 6. Popularity Score [0, 1] (log-damped reviews count)
    const reviewCount = Math.min(product.reviews || 0, 5000);
    const popularityScore = Math.min(1.0, Math.log10(reviewCount + 1) / Math.log10(5001));

    // 7. Image Similarity [0, 1]
    const imageSimilarity = context.imageSimilarity !== undefined ? context.imageSimilarity : 0.5;

    // Weighted combination
    const total = (
      semanticSimilarity * this.weights.semanticSimilarity +
      attributeScore     * this.weights.attributeMatch +
      categoryScore      * this.weights.categoryMatch +
      priceFitScore      * this.weights.priceFit +
      ratingScore        * this.weights.ratingScore +
      popularityScore    * this.weights.popularityScore +
      imageSimilarity    * this.weights.imageSimilarity
    );

    const score = Math.round(Math.max(0, Math.min(1, total)) * 1000) / 1000;

    return {
      score,
      breakdown: {
        semanticSimilarity,
        attributeScore,
        categoryScore,
        priceFitScore,
        ratingScore,
        popularityScore,
        imageSimilarity
      }
    };
  }

  /**
   * Rank a candidate list of products
   * @param {object[]} products
   * @param {object} context
   * @param {Function} [semanticScoreFn] - (productId) => number
   * @returns {{ product: object, score: number, breakdown: object }[]} sorted descending
   */
  rank(products, context = {}, semanticScoreFn = null) {
    if (!Array.isArray(products) || products.length === 0) return [];

    const scored = products.map(product => {
      const semSim = semanticScoreFn ? semanticScoreFn(product.id) : (context.semanticSimilarity || 0.5);
      const prodContext = { ...context, semanticSimilarity: semSim };
      const { score, breakdown } = this.scoreProduct(product, prodContext);
      return { product, score, breakdown };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  rankProducts(products, context = {}, semanticScoreFn = null) {
    return this.rank(products, context, semanticScoreFn);
  }
}

export const rankingService = new RankingService();
