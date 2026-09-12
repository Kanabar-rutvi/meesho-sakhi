/**
 * Recommendation Feature Extractor
 *
 * Derives user features from the existing PreferenceEngine profile and
 * ActivityLog signals. No sensitive data is stored.
 * Output is consumed by recommendationService and (in future) the ML model.
 */

/**
 * Extract a feature vector from a user's preference profile.
 *
 * @param {object|null} preferenceProfile  - prefs.profile from PreferenceEngine
 * @param {object|null} conversationCtx    - result of getContext(conversationId)
 * @returns {object} feature map
 */
export function extractFeatures(preferenceProfile = null, conversationCtx = null) {
  const features = {
    preferredCategories:       [],
    preferredSubcategories:    [],
    preferredBrands:           [],
    averagePrice:              0,
    minPrice:                  0,
    maxPrice:                  0,
    preferredTags:             [],
    averageRatingPreference:   3.5,  // neutral default
    interactionCounts:         {},
    recencyFeatures: {
      lastCategory:            null,
      lastSubcategory:         null,
      lastBudget:              null,
      lastQuery:               null,
      lastSearchCriteria:      null,
      lastRecommendedProductIds: [],
    },
    isNewUser: true,
  };

  // ── Extract from PreferenceEngine profile ─────────────────────────────────
  if (preferenceProfile && typeof preferenceProfile === 'object') {
    // category_scores: { bedding: 0.4, electronics: 0.6, ... }
    const catScores = preferenceProfile.category_scores || {};
    features.preferredCategories = Object.entries(catScores)
      .filter(([, v]) => v > 0.1)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    // price signals
    if (typeof preferenceProfile.avg_price === 'number') {
      features.averagePrice = preferenceProfile.avg_price;
    }
    if (typeof preferenceProfile.min_price === 'number') {
      features.minPrice = preferenceProfile.min_price;
    }
    if (typeof preferenceProfile.max_price === 'number') {
      features.maxPrice = preferenceProfile.max_price;
    }

    // tag preferences
    const tagScores = preferenceProfile.tag_scores || {};
    features.preferredTags = Object.entries(tagScores)
      .filter(([, v]) => v > 0.1)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 10);

    // rating preference
    if (typeof preferenceProfile.min_rating_pref === 'number') {
      features.averageRatingPreference = preferenceProfile.min_rating_pref;
    }

    // brands
    const brandScores = preferenceProfile.brand_scores || {};
    features.preferredBrands = Object.entries(brandScores)
      .filter(([, v]) => v > 0.1)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 5);

    // interaction signal to detect new vs returning user
    const totalInteractions = Object.values(preferenceProfile.interaction_counts || {})
      .reduce((a, b) => a + b, 0);
    features.interactionCounts = preferenceProfile.interaction_counts || {};
    features.isNewUser = totalInteractions < 3;
  }

  // ── Extract from conversation context ─────────────────────────────────────
  if (conversationCtx && typeof conversationCtx === 'object') {
    features.recencyFeatures.lastCategory     = conversationCtx.lastCategories?.[0] || null;
    features.recencyFeatures.lastBudget       = conversationCtx.lastBudget       || null;
    features.recencyFeatures.lastQuery        = conversationCtx.lastQuery         || null;
    features.recencyFeatures.lastSearchCriteria = conversationCtx.lastSearchCriteria || null;
    features.recencyFeatures.lastRecommendedProductIds = conversationCtx.lastProductIds || [];

    // Boost the last-used category if preference list is otherwise empty
    const lastCat = conversationCtx.lastCategories?.[0];
    if (lastCat && !features.preferredCategories.includes(lastCat)) {
      features.preferredCategories.unshift(lastCat);
    }
  }

  return features;
}
