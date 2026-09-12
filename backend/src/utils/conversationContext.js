/**
 * In-memory conversation context store.
 *
 * Fields stored per conversation:
 *   lastIntent, lastQuery, lastCategories, lastBudget,
 *   lastProductIds, lastProducts, lastResponse,
 *   lastSearchCriteria, lastSubcategory, lastPriceRange,
 *   lastRecommendedProductIds, lastRecommendationSource,
 *   updatedAt
 */
const contexts = new Map();

const CONTEXT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CONTEXTS = 1000;

export function getContext(conversationId) {
  if (!conversationId) return null;

  const ctx = contexts.get(conversationId);
  if (!ctx) return null;

  if (Date.now() - ctx.updatedAt > CONTEXT_TTL_MS) {
    contexts.delete(conversationId);
    return null;
  }

  return ctx;
}

export function updateContext(conversationId, data) {
  if (!conversationId) return;

  // Eviction policy
  if (contexts.size >= MAX_CONTEXTS && !contexts.has(conversationId)) {
    // Delete oldest entry (Map iterates in insertion order)
    const oldestKey = contexts.keys().next().value;
    contexts.delete(oldestKey);
  }

  const existing = contexts.get(conversationId) || {};
  
  contexts.set(conversationId, {
    ...existing,
    ...data,
    conversationId,
    updatedAt: Date.now()
  });
}

export function clearContext(conversationId) {
  if (conversationId) {
    contexts.delete(conversationId);
  }
}
