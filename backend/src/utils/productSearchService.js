/**
 * Product Search Service
 *
 * Central abstraction over the Catalog Service for all product retrieval.
 * Supports keyword search, composite filters, and multiple sort modes.
 *
 * TODO (PostgreSQL migration): Replace catalogSearch / getProducts* calls with
 *   Prisma queries. The external API of this file must NOT change.
 *
 * TODO (Vector search): Add a semantic search path using pgvector or an external
 *   search engine (Elasticsearch/OpenSearch). Route there when query is long-form.
 */

import {
  getAllProducts,
  getProductById as catalogGetById,
  getProductsByIds as catalogGetByIds,
  getProductsByCategory,
  getProductsByCategoryAndBudget,
  searchProducts as catalogSearch
} from './catalog.js';
import { rankingService } from '../services/search/rankingService.js';
import { embeddingService } from '../services/search/embeddingService.js';

// ── Bounded result limits ──────────────────────────────────────────────────────
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT     = 100;

// ── Lightweight bounded cache ─────────────────────────────────────────────────
const CACHE_TTL_MS  = 5 * 60 * 1000;   // 5 minutes
const CACHE_MAX     = 200;
const _cache        = new Map();

function _cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return entry.value;
}

function _cacheSet(key, value) {
  if (_cache.size >= CACHE_MAX) {
    _cache.delete(_cache.keys().next().value); // evict oldest
  }
  _cache.set(key, { value, ts: Date.now() });
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function _resolveLimit(limit) {
  if (!limit || typeof limit !== 'number' || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

function _applySort(products, sortBy, criteria = {}) {
  const arr = [...products]; // never mutate caller's array
  switch (sortBy) {
    case 'price_low':   return arr.sort((a, b) => a.price - b.price);
    case 'price_high':  return arr.sort((a, b) => b.price - a.price);
    case 'rating':      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'popularity':  return arr.sort((a, b) => ((b.reviews || 0) + (b.rating || 0) * 100) -
                                                    ((a.reviews || 0) + (a.rating || 0) * 100));
    case 'newest':      return arr.sort((a, b) =>
                          new Date(b.created_at || 0) - new Date(a.created_at || 0));
    case 'relevance':
    default:            return _sortByRelevance(arr, criteria);
  }
}

function _sortByRelevance(products, criteria) {
  const q = (criteria.query || '').toLowerCase();
  const semScoreFn = (pid) => {
    return q ? embeddingService.getSemanticSimilarity(q, pid) : 0.6;
  };
  const ranked = rankingService.rank(products, criteria, semScoreFn);
  return ranked.map(r => r.product);
}

function _keywordFilter(products, query) {
  if (!query || typeof query !== 'string') return products;
  const q = query.toLowerCase();
  return products.filter(p =>
    (p.name  || '').toLowerCase().includes(q) ||
    (p.brand || '').toLowerCase().includes(q) ||
    (p.tags  || []).some(t => t.toLowerCase().includes(q)) ||
    (p.description || '').toLowerCase().includes(q)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Composite search across the catalog.
 *
 * @param {object} criteria
 * @param {string}   [criteria.query]       - keyword search
 * @param {string}   [criteria.category]
 * @param {string}   [criteria.subcategory]
 * @param {string}   [criteria.brand]
 * @param {number}   [criteria.minPrice]
 * @param {number}   [criteria.maxPrice]
 * @param {number}   [criteria.minRating]
 * @param {string[]} [criteria.tags]
 * @param {object}   [criteria.attributes]
 * @param {string[]} [criteria.ids]         - restrict to specific IDs
 * @param {number}   [criteria.limit]       - clamped to MAX_LIMIT
 * @param {string}   [criteria.sortBy]      - relevance|price_low|price_high|rating|popularity|newest
 * @returns {object[]}
 */
export function search(criteria = {}) {
  try {
    // Defensive validation
    if (criteria.maxPrice  !== undefined && criteria.maxPrice  < 0) return [];
    if (criteria.minPrice  !== undefined && criteria.minPrice  < 0) return [];
    if (criteria.minRating !== undefined && (criteria.minRating < 0 || criteria.minRating > 5)) return [];

    const limit  = _resolveLimit(criteria.limit);
    const sortBy = criteria.sortBy || 'relevance';

    // Cache key (skip caching when ids are supplied — always specific)
    const cacheKey = !criteria.ids
      ? JSON.stringify({ ...criteria, limit: undefined, sortBy: undefined })
      : null;
    if (cacheKey) {
      const cached = _cacheGet(cacheKey);
      if (cached) {
        return _applySort(cached, sortBy, criteria).slice(0, limit);
      }
    }

    // Build catalog-search criteria (rating field name translation)
    const searchCriteria = {};
    if (criteria.category)    searchCriteria.category    = criteria.category;
    if (criteria.subcategory) searchCriteria.subcategory = criteria.subcategory;
    if (criteria.brand)       searchCriteria.brand       = criteria.brand;
    if (criteria.minPrice  !== undefined) searchCriteria.minPrice  = criteria.minPrice;
    if (criteria.maxPrice  !== undefined) searchCriteria.maxPrice  = criteria.maxPrice;
    if (criteria.minRating !== undefined) searchCriteria.rating    = criteria.minRating;
    if (Array.isArray(criteria.tags) && criteria.tags.length > 0) searchCriteria.tags = criteria.tags;
    if (criteria.attributes) searchCriteria.attributes = criteria.attributes;

    let results = catalogSearch(searchCriteria);

    // Keyword filter (TODO: replace with full-text SQL or vector search)
    if (criteria.query) {
      results = _keywordFilter(results, criteria.query);
    }

    // ID restriction
    if (Array.isArray(criteria.ids) && criteria.ids.length > 0) {
      const idSet = new Set(criteria.ids);
      results = results.filter(p => idSet.has(p.id));
    }

    if (cacheKey) _cacheSet(cacheKey, results);

    return _applySort(results, sortBy, criteria).slice(0, limit);

  } catch (err) {
    console.error('[ProductSearchService] search() error:', err.message);
    return [];
  }
}

/** Look up a single product by ID. */
export function getById(id) {
  if (!id || typeof id !== 'string') return null;
  return catalogGetById(id);
}

/** Look up multiple products by IDs. */
export function getByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  return catalogGetByIds(ids);
}

/** All products in a category (alias-resolved). */
export function getByCategory(category, limit) {
  if (!category || typeof category !== 'string') return [];
  return getProductsByCategory(category).slice(0, _resolveLimit(limit));
}

/** All products matching a subcategory across all normalised categories. */
export function getBySubcategory(subcategory, limit) {
  if (!subcategory || typeof subcategory !== 'string') return [];
  const subLower = subcategory.toLowerCase();
  return getAllProducts()
    .filter(p => (p.subcategory || '').toLowerCase() === subLower)
    .slice(0, _resolveLimit(limit));
}

/** Products in a category at or under maxBudget. */
export function getByBudget(category, maxBudget) {
  if (!category || typeof category !== 'string') return [];
  if (typeof maxBudget !== 'number' || maxBudget < 0) return [];
  return getProductsByCategoryAndBudget(category, maxBudget).slice(0, MAX_LIMIT);
}

/** Products within a price window across all categories. */
export function getByPriceRange(minPrice, maxPrice, limit) {
  if (typeof minPrice !== 'number' || typeof maxPrice !== 'number') return [];
  if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) return [];
  return getAllProducts()
    .filter(p => p.price >= minPrice && p.price <= maxPrice)
    .slice(0, _resolveLimit(limit));
}

/** Catalog statistics summary (for admin). */
export function getCatalogStats() {
  const all = getAllProducts();
  const cats    = new Set(all.map(p => p.category));
  const subcats = new Set(all.map(p => p.subcategory).filter(Boolean));
  const brands  = new Set(all.map(p => p.brand).filter(Boolean));
  const prices  = all.map(p => p.price).filter(p => p >= 0);
  const ratings = all.map(p => p.rating).filter(r => r > 0);

  return {
    totalProducts: all.length,
    categories:    [...cats],
    subcategories: [...subcats],
    brands:        [...brands],
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
    averageRating: ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
      : 0,
  };
}
