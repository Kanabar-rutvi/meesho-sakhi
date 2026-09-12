/**
 * Product Reference Resolver
 *
 * Resolves natural-language product references like "the first one",
 * "the cheapest", "the second product", "the best rated" into a specific
 * product from the conversation context.
 *
 * All resolution is deterministic — zero Claude calls.
 */

/**
 * Ordinal words → 0-based index
 */
const ORDINAL_MAP = [
  ['fifth',  4], ['5th', 4],
  ['fourth', 3], ['4th', 3],
  ['third',  2], ['3rd', 2],
  ['second', 1], ['2nd', 1],
  ['first',  0], ['1st', 0],
];

/**
 * Resolve a user query against a list of previous products.
 *
 * @param {string}   query    - raw user query
 * @param {object[]} products - lastProducts from conversationContext (id, name, price, rating)
 * @returns {{ product: object|null, index: number|null, method: string }}
 */
export function resolveProductReference(query, products) {
  if (!Array.isArray(products) || products.length === 0) {
    return { product: null, index: null, method: 'none' };
  }

  const q = query.toLowerCase();

  // ── Superlative references (check BEFORE ordinals to avoid "first" conflicting) ─
  if (q.includes('most expensive') || (q.includes('expensive') && !q.includes('most affordable'))) {
    const sorted = [...products].sort((a, b) => b.price - a.price);
    const idx = products.findIndex(p => p.id === sorted[0].id);
    return { product: sorted[0], index: idx, method: 'most_expensive' };
  }

  if (q.includes('cheapest') || q.includes('most affordable') || (q.includes('cheap') && !q.includes('cheaper') && !q.includes('expensive'))) {
    const sorted = [...products].sort((a, b) => a.price - b.price);
    const idx = products.findIndex(p => p.id === sorted[0].id);
    return { product: sorted[0], index: idx, method: 'cheapest' };
  }

  if (q.includes('best rated') || q.includes('best rating') || q.includes('highest rated') || q.includes('highest rating')) {
    const sorted = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const idx = products.findIndex(p => p.id === sorted[0].id);
    return { product: sorted[0], index: idx, method: 'best_rated' };
  }

  if (q.includes('most reviews') || q.includes('most reviewed')) {
    const sorted = [...products].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    const idx = products.findIndex(p => p.id === sorted[0].id);
    return { product: sorted[0], index: idx, method: 'most_reviewed' };
  }

  // ── Ordinal references: check longest/most-specific word first ───────────────
  for (const [word, idx] of ORDINAL_MAP) {
    if (q.includes(word) && idx < products.length) {
      return { product: products[idx], index: idx, method: 'ordinal' };
    }
  }

  // ── "that one" / "this one" — default to first product ────────────────────
  if (q.includes('that one') || q.includes('this one') || q.includes('that product')) {
    return { product: products[0], index: 0, method: 'default_first' };
  }

  return { product: null, index: null, method: 'none' };
}

/**
 * Generate a natural-language description of a product for "tell me more" queries.
 *
 * @param {object} product
 * @returns {string}
 */
export function describeProduct(product) {
  if (!product) return "I couldn't find that product.";
  const parts = [
    `**${product.name}**`,
    `Price: ₹${product.price}`,
    product.brand && product.brand !== 'Unknown' ? `Brand: ${product.brand}` : null,
    product.rating ? `Rating: ${product.rating}⭐ (${product.reviews || 0} reviews)` : null,
    product.tags?.length ? `Tags: ${product.tags.slice(0, 4).join(', ')}` : null,
    product.description ? `\n${product.description}` : null,
  ].filter(Boolean);
  return parts.join(' | ');
}
