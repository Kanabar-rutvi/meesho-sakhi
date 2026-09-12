/**
 * Product Ingestion Service
 *
 * Provides validation, normalisation, and deduplication for incoming product data.
 * Currently operates on in-memory data from catalog.js.
 *
 * FUTURE: When catalog moves to PostgreSQL, this service will write to the
 * products table via Prisma. No other file needs to change.
 */

import { resolveCategory } from './categoryTaxonomy.js';

const VALID_PRICE_MIN = 0;
const VALID_PRICE_MAX = 10_000_000;
const VALID_RATING_MIN = 0;
const VALID_RATING_MAX = 5;

/**
 * Validate a single product record.
 * @param {object} product
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProduct(product) {
  const errors = [];

  if (!product || typeof product !== 'object') {
    return { valid: false, errors: ['Product must be a non-null object'] };
  }

  if (!product.id || typeof product.id !== 'string' || !product.id.trim()) {
    errors.push('Missing or invalid id');
  }

  if (!product.name || typeof product.name !== 'string' || !product.name.trim()) {
    errors.push('Missing or invalid name');
  }

  if (typeof product.price !== 'number' || product.price < VALID_PRICE_MIN || product.price > VALID_PRICE_MAX) {
    errors.push(`Invalid price: ${product.price}`);
  }

  if (product.rating !== undefined) {
    if (typeof product.rating !== 'number' || product.rating < VALID_RATING_MIN || product.rating > VALID_RATING_MAX) {
      errors.push(`Invalid rating: ${product.rating}`);
    }
  }

  if (!product.category || typeof product.category !== 'string') {
    errors.push('Missing or invalid category');
  }

  if (product.tags !== undefined && !Array.isArray(product.tags)) {
    errors.push('tags must be an array');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Normalise a raw product into the standard schema.
 * @param {object} raw
 * @returns {object} normalised product
 */
export function normalizeProduct(raw) {
  const resolved = resolveCategory(raw.category);
  return {
    id:              raw.id,
    name:            raw.name,
    description:     raw.description     || '',
    category:        resolved ? resolved.category    : (raw.category || 'unknown'),
    subcategory:     resolved ? resolved.subcategory : (raw.subcategory || null),
    originalCategory:raw.category,
    brand:           raw.brand           || 'Unknown',
    price:           raw.price,
    original_price:  raw.original_price  || raw.price,
    discount:        raw.discount        || 0,
    rating:          raw.rating          || 0,
    reviews:         raw.reviews         || 0,
    tags:            raw.tags            || [],
    attributes:      raw.attributes      || {},
    image_url:       raw.image_url       || null,
    in_stock:        raw.in_stock !== undefined ? raw.in_stock : true,
    popularity_score:raw.popularity_score || 0,
    trust_score:     raw.trust_score     || 0,
    created_at:      raw.created_at      || new Date().toISOString(),
    updated_at:      raw.updated_at      || new Date().toISOString(),
  };
}

/**
 * Remove duplicate products by ID (keeps first occurrence).
 * @param {object[]} products
 * @returns {object[]}
 */
export function deduplicateProducts(products) {
  if (!Array.isArray(products)) return [];
  const seen = new Set();
  return products.filter(p => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/**
 * Validate, normalise, and deduplicate a batch of products.
 * Throws on invalid products so callers can decide whether to abort or skip.
 *
 * @param {object[]} products
 * @returns {{ ingested: object[], rejected: { product: object, errors: string[] }[] }}
 */
export function ingestProducts(products) {
  if (!Array.isArray(products)) throw new Error('ingestProducts: input must be an array');

  const ingested = [];
  const rejected = [];

  for (const raw of products) {
    const { valid, errors } = validateProduct(raw);
    if (!valid) {
      rejected.push({ product: raw, errors });
    } else {
      ingested.push(normalizeProduct(raw));
    }
  }

  // Deduplicate after normalisation
  const deduped = deduplicateProducts(ingested);

  return { ingested: deduped, rejected };
}
