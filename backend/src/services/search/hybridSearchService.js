/**
 * Hybrid Product Search Service
 *
 * Implements candidate retrieval across inverted keyword index,
 * semantic text vectors, category taxonomy, price/attribute constraints,
 * and ML ranking score.
 */

import { getAllProducts, getProductById, searchProducts } from '../../utils/catalog.js';
import { resolveCategory } from '../../utils/categoryTaxonomy.js';
import { embeddingService } from './embeddingService.js';
import { rankingService } from './rankingService.js';

export class HybridSearchService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Ensure embeddings and indices are loaded
   */
  async ensureInitialized() {
    if (!this.initialized) {
      const all = getAllProducts();
      await embeddingService.indexCatalog(all, false);
      this.initialized = true;
    }
  }

  /**
   * Perform hybrid search across the catalog
   * @param {object} criteria
   * @param {string} [criteria.query]
   * @param {string} [criteria.category]
   * @param {string} [criteria.subcategory]
   * @param {string} [criteria.brand]
   * @param {number} [criteria.minPrice]
   * @param {number} [criteria.maxPrice]
   * @param {number} [criteria.budget]
   * @param {number} [criteria.minRating]
   * @param {string[]} [criteria.tags]
   * @param {object} [criteria.attributes]
   * @param {string[]} [criteria.ids]
   * @param {string} [criteria.imageUrl] - for visual search
   * @param {number} [criteria.limit=20]
   * @param {string} [criteria.sortBy='relevance']
   * @returns {Promise<{ products: object[], total: number, queryMetadata: object }>}
   */
  async search(criteria = {}) {
    await this.ensureInitialized();

    const limit = Math.min(Math.max(criteria.limit || 20, 1), 100);
    const query = (criteria.query || '').trim();
    const maxPrice = criteria.maxPrice !== undefined ? criteria.maxPrice : criteria.budget;
    const minPrice = criteria.minPrice;
    const minRating = criteria.minRating;

    // 1. Resolve category & subcategory from query or criteria
    let resolvedCat = criteria.category;
    let resolvedSub = criteria.subcategory;

    if (!resolvedCat && query) {
      const taxonomyMatch = resolveCategory(query);
      if (taxonomyMatch) {
        resolvedCat = taxonomyMatch.category;
        resolvedSub = taxonomyMatch.subcategory || resolvedSub;
      }
    } else if (resolvedCat) {
      const taxonomyMatch = resolveCategory(resolvedCat);
      if (taxonomyMatch) {
        resolvedCat = taxonomyMatch.category;
        resolvedSub = resolvedSub || taxonomyMatch.subcategory;
      }
    }

    // 2. Candidate Retrieval (broad candidate set of 50–150 items)
    let candidates = getAllProducts();

    // ID filter
    if (Array.isArray(criteria.ids) && criteria.ids.length > 0) {
      const idSet = new Set(criteria.ids);
      candidates = candidates.filter(p => idSet.has(p.id));
    }

    // Category filter (soft filter: prefer matching category, don't empty results if too strict)
    if (resolvedCat) {
      const targetCat = resolvedCat.toLowerCase();
      const filteredByCat = candidates.filter(p => {
        const c1 = (p.category || '').toLowerCase();
        const c2 = (p.originalCategory || '').toLowerCase();
        return c1 === targetCat || c2 === targetCat || c1.includes(targetCat) || targetCat.includes(c1);
      });

      if (filteredByCat.length > 0) {
        candidates = filteredByCat;
        if (resolvedSub) {
          const targetSub = resolvedSub.toLowerCase();
          const filteredBySub = candidates.filter(p =>
            p.subcategory && p.subcategory.toLowerCase() === targetSub
          );
          if (filteredBySub.length >= 3) {
            candidates = filteredBySub;
          }
        }
      }
    }

    // Price constraints
    if (maxPrice !== undefined && maxPrice > 0) {
      candidates = candidates.filter(p => p.price <= maxPrice);
    }
    if (minPrice !== undefined && minPrice > 0) {
      candidates = candidates.filter(p => p.price >= minPrice);
    }

    // Rating constraint
    if (minRating !== undefined && minRating > 0) {
      candidates = candidates.filter(p => (p.rating || 0) >= minRating);
    }

    // Brand constraint
    if (criteria.brand) {
      const bTarget = criteria.brand.toLowerCase();
      candidates = candidates.filter(p => (p.brand || '').toLowerCase() === bTarget);
    }

    // Stock constraint
    candidates = candidates.filter(p => p.in_stock !== false);

    // 3. Keyword / BM25 text filter when query is present
    if (query) {
      const qTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
      const scoredByText = candidates.map(p => {
        const text = `${p.name} ${p.category} ${p.subcategory || ''} ${p.brand || ''} ${(p.tags || []).join(' ')} ${p.description || ''}`.toLowerCase();
        let termMatches = 0;
        for (const t of qTokens) {
          if (text.includes(t)) termMatches++;
        }
        return { product: p, termMatches };
      });

      // Filter to items with at least one keyword match if matches exist
      const matchingItems = scoredByText.filter(x => x.termMatches > 0);
      if (matchingItems.length > 0) {
        candidates = matchingItems
          .sort((a, b) => b.termMatches - a.termMatches)
          .map(x => x.product);
      }
    }

    // 4. ML / Multi-factor ranking
    const rankingContext = {
      query,
      category: resolvedCat,
      subcategory: resolvedSub,
      maxPrice,
      minPrice,
      attributes: criteria.attributes,
      tags: criteria.tags,
      brand: criteria.brand
    };

    const semanticScoreFn = (productId) => {
      return query ? embeddingService.getSemanticSimilarity(query, productId) : 0.6;
    };

    const rankedResults = rankingService.rank(candidates, rankingContext, semanticScoreFn);

    // Apply sort mode overrides if specified
    const sortBy = criteria.sortBy || 'relevance';
    let sortedList = rankedResults;

    if (sortBy === 'price_low') {
      sortedList = [...rankedResults].sort((a, b) => a.product.price - b.product.price);
    } else if (sortBy === 'price_high') {
      sortedList = [...rankedResults].sort((a, b) => b.product.price - a.product.price);
    } else if (sortBy === 'rating') {
      sortedList = [...rankedResults].sort((a, b) => (b.product.rating || 0) - (a.product.rating || 0));
    } else if (sortBy === 'popularity') {
      sortedList = [...rankedResults].sort((a, b) => (b.product.reviews || 0) - (a.product.reviews || 0));
    }

    // Deduplication & safety check: enforce unique product IDs and unique images per result set
    const seenIds = new Set();
    const seenImages = new Set();
    const uniqueRanked = [];

    for (const item of sortedList) {
      if (!item || !item.product) continue;
      const p = item.product;
      if (p.validationStatus === 'REJECTED') continue;
      const pId = p.id;
      const pImg = p.image || (p.images && p.images[0] && p.images[0].url);

      if (seenIds.has(pId)) continue;
      if (pImg && seenImages.has(pImg)) continue;

      seenIds.add(pId);
      if (pImg) seenImages.add(pImg);
      uniqueRanked.push(item);
    }

    const paginated = uniqueRanked.slice(0, limit);

    return {
      products: paginated.map(r => r.product),
      rankedItems: paginated.map(r => ({
        id: r.product.id,
        name: r.product.name,
        price: r.product.price,
        score: r.score,
        breakdown: r.breakdown
      })),
      total: sortedList.length,
      queryMetadata: {
        resolvedCategory: resolvedCat,
        resolvedSubcategory: resolvedSub,
        filterBudget: maxPrice,
        candidateCount: candidates.length
      }
    };
  }
}

export const hybridSearchService = new HybridSearchService();
