/**
 * Confidence Scorer Service
 *
 * Combines availability, visual semantic similarity, category consistency,
 * and duplicate penalties to assign a robust confidence score and validation state.
 */

export const VALIDATION_STATES = {
  VALID: "VALID",
  MISMATCH: "MISMATCH",
  DUPLICATE_IMAGE: "DUPLICATE_IMAGE",
  BROKEN_IMAGE: "BROKEN_IMAGE",
  NEEDS_REVIEW: "NEEDS_REVIEW"
};

export const DEFAULT_THRESHOLDS = {
  minValidConfidence: 0.70,
  mismatchThreshold: 0.35,
  duplicatePenaltyWeight: 0.35,
  minAvailabilityScore: 0.50
};

export class ConfidenceScorer {
  constructor(thresholds = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Score a product's image and metadata consistency
   * @param {object} params
   * @param {object} params.product
   * @param {boolean} params.isReachable
   * @param {number} params.visualSimilarity
   * @param {string} params.visualReason
   * @param {boolean} params.isDuplicate
   * @param {string[]} params.duplicateWith
   * @param {boolean} params.categoryConsistent
   * @returns {{ status: string, confidence: number, reason: string, breakdown: object }}
   */
  score({
    product,
    isReachable,
    visualSimilarity = 0.5,
    visualReason = '',
    isDuplicate = false,
    duplicateWith = [],
    categoryConsistent = true
  }) {
    // 1. Broken image state
    if (!isReachable) {
      return {
        status: VALIDATION_STATES.BROKEN_IMAGE,
        confidence: 0.0,
        reason: "Image URL is unreachable, timed out, or returned a non-image content-type",
        breakdown: { availability: 0, visual: 0, category: 0, duplicatePenalty: 0 }
      };
    }

    // 2. Component scores (normalized 0–1)
    const availabilityScore = 1.0;
    const visualScore = Math.max(0, Math.min(1, visualSimilarity));
    const categoryScore = categoryConsistent ? 1.0 : 0.2;
    const tagScore = (product.tags && product.tags.length > 0) ? 0.9 : 0.6;
    const duplicatePenalty = isDuplicate ? this.thresholds.duplicatePenaltyWeight : 0.0;

    // Weighted combination
    let rawScore = (
      availabilityScore * 0.20 +
      visualScore       * 0.45 +
      categoryScore     * 0.25 +
      tagScore          * 0.10
    ) - duplicatePenalty;

    const confidence = Math.round(Math.max(0.01, Math.min(0.99, rawScore)) * 100) / 100;

    // 3. State assignment based on criteria & thresholds
    if (visualScore <= this.thresholds.mismatchThreshold) {
      return {
        status: VALIDATION_STATES.MISMATCH,
        confidence,
        reason: visualReason || `Visual contents do not match product category '${product.category}'`,
        breakdown: { availabilityScore, visualScore, categoryScore, duplicatePenalty }
      };
    }

    if (isDuplicate) {
      return {
        status: VALIDATION_STATES.DUPLICATE_IMAGE,
        confidence,
        reason: `Image URL is identically reused across product(s): ${duplicateWith.slice(0, 3).join(', ')}`,
        breakdown: { availabilityScore, visualScore, categoryScore, duplicatePenalty }
      };
    }

    if (confidence >= this.thresholds.minValidConfidence) {
      return {
        status: VALIDATION_STATES.VALID,
        confidence,
        reason: "Product metadata and image visual features are consistent and verified",
        breakdown: { availabilityScore, visualScore, categoryScore, duplicatePenalty }
      };
    }

    return {
      status: VALIDATION_STATES.NEEDS_REVIEW,
      confidence,
      reason: visualReason || "Low confidence in visual/semantic alignment; manual review suggested",
      breakdown: { availabilityScore, visualScore, categoryScore, duplicatePenalty }
    };
  }
}
