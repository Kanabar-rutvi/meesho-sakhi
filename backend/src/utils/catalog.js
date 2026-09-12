import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCategory } from './categoryTaxonomy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let RAW_CATALOG = [];
let NORMALIZED_CATALOG = [];

try {
  const catalogPath = path.resolve(__dirname, '..', '..', 'catalog.json');
  RAW_CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (e) {
  console.error("[catalog] Failed to load catalog.json:", e.message);
  process.exit(1); // Fail clearly if corrupted
}

const productById = new Map();
const categoryIndex = new Map();

// STEP 7: Data Validation & STEP 2: Normalized Structure
for (const raw of RAW_CATALOG) {
  if (!raw.id || productById.has(raw.id)) {
    console.error(`[catalog] FATAL: Duplicate or missing ID detected: ${raw.id}`);
    process.exit(1);
  }
  if (!raw.name) {
    console.error(`[catalog] FATAL: Product missing name: ${raw.id}`);
    process.exit(1);
  }
  if (typeof raw.price !== 'number' || raw.price < 0) {
    console.error(`[catalog] FATAL: Invalid price for ${raw.id}: ${raw.price}`);
    process.exit(1);
  }
  if (raw.rating !== undefined && (typeof raw.rating !== 'number' || raw.rating < 0 || raw.rating > 5)) {
    console.error(`[catalog] FATAL: Invalid rating for ${raw.id}: ${raw.rating}`);
    process.exit(1);
  }
  if (!raw.category) {
    console.error(`[catalog] FATAL: Missing category for ${raw.id}`);
    process.exit(1);
  }

  // Resolve subcategory backward-compatibly
  const resolved = resolveCategory(raw.category);
  const normalizedCategory = resolved ? resolved.category : raw.category;
  const normalizedSubcategory = (resolved && resolved.subcategory) 
    ? resolved.subcategory 
    : (raw.subcategory ? raw.subcategory.toLowerCase() : null);

  const originalPrice = raw.originalPrice || Math.max(raw.price, Math.round((raw.price * 1.35) / 50) * 50);
  const discountPercent = raw.discountPercent !== undefined
    ? raw.discountPercent
    : Math.max(0, Math.round(((originalPrice - raw.price) / (originalPrice || 1)) * 100));
  const images = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images
    : [{ url: raw.image || raw.image_url, type: 'main' }];

  const normalizedProduct = {
    ...raw,
    id: raw.id,
    name: raw.name,
    category: normalizedCategory,
    subcategory: normalizedSubcategory,
    originalCategory: raw.category, // for backward compatibility lookups
    originalSubcategory: raw.subcategory || null,
    price: raw.price,
    originalPrice,
    discountPercent,
    rating: raw.rating || 0,
    reviews: raw.reviews || raw.reviewCount || 0,
    reviewCount: raw.reviewCount || raw.reviews || 0,
    brand: raw.brand || "Unknown",
    tags: raw.tags || [],
    attributes: raw.attributes || {},
    description: raw.description || `${raw.brand || ''} ${raw.name}`,
    image: raw.image || raw.image_url || (images[0] && images[0].url),
    image_url: raw.image_url || raw.image || (images[0] && images[0].url),
    images,
    in_stock: raw.in_stock !== undefined ? raw.in_stock : true,
    availability: raw.availability !== undefined ? raw.availability : true
  };

  NORMALIZED_CATALOG.push(normalizedProduct);
  productById.set(normalizedProduct.id, normalizedProduct);

  // Index by category and subcategory
  const keysToIndex = [
    raw.category,
    raw.subcategory,
    normalizedCategory,
    normalizedSubcategory
  ].filter(Boolean);

  for (const key of keysToIndex) {
    const k = String(key).toLowerCase();
    if (!categoryIndex.has(k)) {
      categoryIndex.set(k, []);
    }
    if (!categoryIndex.get(k).includes(normalizedProduct)) {
      categoryIndex.get(k).push(normalizedProduct);
    }
  }
}

// ---------------------------------------------------------
// Existing APIs (Backward Compatibility)
// ---------------------------------------------------------
export function getAllProducts() {
  return NORMALIZED_CATALOG;
}

export function getProductById(id) {
  return productById.get(id) || null;
}

export function getProductsByCategory(category) {
  if (!category) return [];
  const cLower = String(category).toLowerCase();

  // 1. Direct index match (e.g. "kitchen", "bedding", "electronics", "fashion")
  if (categoryIndex.has(cLower)) {
    return categoryIndex.get(cLower);
  }

  // 2. Resolve via taxonomy
  const resolved = resolveCategory(category);
  if (resolved) {
    if (resolved.subcategory && categoryIndex.has(resolved.subcategory.toLowerCase())) {
      return categoryIndex.get(resolved.subcategory.toLowerCase());
    }
    if (resolved.category && categoryIndex.has(resolved.category.toLowerCase())) {
      return categoryIndex.get(resolved.category.toLowerCase());
    }
  }

  return [];
}

export function getProductsByCategoryAndBudget(category, budget) {
  const catProducts = getProductsByCategory(category);
  return catProducts.filter(p => p.price <= budget);
}

export function getProductsByIds(ids) {
  return ids.map(id => productById.get(id)).filter(Boolean);
}

// ---------------------------------------------------------
// New APIs (Scalable Architecture)
// ---------------------------------------------------------

export function getProductsBySubcategory(category, subcategory) {
  const prods = categoryIndex.get(category) || [];
  const subLower = (subcategory || '').toLowerCase();
  return prods.filter(p => (p.subcategory || '').toLowerCase() === subLower);
}

/**
 * Reusable search function supporting dynamic filters
 */
export function searchProducts(criteria = {}) {
  let results = NORMALIZED_CATALOG;

  if (criteria.category) {
    const resolved = resolveCategory(criteria.category);
    const catToSearch = resolved ? resolved.category : criteria.category;
    results = categoryIndex.get(catToSearch) || [];

    if (criteria.subcategory || (resolved && resolved.subcategory)) {
      const sub = (criteria.subcategory || resolved.subcategory).toLowerCase();
      results = results.filter(p => (p.subcategory || '').toLowerCase() === sub);
    }
  }

  if (criteria.brand) {
    const brandLower = criteria.brand.toLowerCase();
    results = results.filter(p => p.brand.toLowerCase() === brandLower);
  }

  if (criteria.minPrice !== undefined) {
    results = results.filter(p => p.price >= criteria.minPrice);
  }

  if (criteria.maxPrice !== undefined || criteria.budget !== undefined) {
    const limit = criteria.maxPrice !== undefined ? criteria.maxPrice : criteria.budget;
    results = results.filter(p => p.price <= limit);
  }

  if (criteria.rating !== undefined) {
    results = results.filter(p => p.rating >= criteria.rating);
  }

  if (criteria.tags && Array.isArray(criteria.tags)) {
    results = results.filter(p => 
      criteria.tags.some(t => p.tags.map(pt => pt.toLowerCase()).includes(t.toLowerCase()))
    );
  }
  
  if (criteria.attributes) {
    results = results.filter(p => {
      for (const [k, v] of Object.entries(criteria.attributes)) {
        if (p.attributes[k] !== v) return false;
      }
      return true;
    });
  }

  return results;
}

// ---------------------------------------------------------
// Admin Mutation APIs
// ---------------------------------------------------------

/** Add a new normalized product to the in-memory catalog at runtime. */
export function addProduct(normalized) {
  if (productById.has(normalized.id)) {
    throw new Error(`Product ID already exists: ${normalized.id}`);
  }
  NORMALIZED_CATALOG.push(normalized);
  productById.set(normalized.id, normalized);

  // Index by category
  for (const cat of [normalized.category, normalized.originalCategory].filter(Boolean)) {
    if (!categoryIndex.has(cat)) categoryIndex.set(cat, []);
    if (!categoryIndex.get(cat).includes(normalized)) {
      categoryIndex.get(cat).push(normalized);
    }
  }
}

/** Update an existing product in-memory. */
export function updateProduct(id, normalized) {
  const existing = productById.get(id);
  if (!existing) throw new Error(`Product not found: ${id}`);

  // Update in-place so array references remain stable
  Object.assign(existing, normalized);
  productById.set(id, existing);
}

/** Soft-delete: mark a product as out of stock so Sakhi won't surface it. */
export function deactivateProduct(id) {
  const existing = productById.get(id);
  if (!existing) throw new Error(`Product not found: ${id}`);
  existing.in_stock = false;
}

export default NORMALIZED_CATALOG;

