/**
 * Catalog Repair Service
 *
 * Implements a safe, auditable repair workflow for invalid, mismatched,
 * duplicate, or broken product catalog items.
 */

import { ProductImageProvider } from './productImageProvider.js';
import { VALIDATION_STATES } from './confidenceScorer.js';

export const REPAIR_ACTIONS = {
  AUTO_FIX: "AUTO_FIX",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  VALID: "VALID"
};

export class CatalogRepair {
  /**
   * Determine suggested repair action for a product evaluation result
   * @param {object} validationResult
   * @returns {{ action: string, suggestedImageUrl: string | null, reason: string }}
   */
  static evaluateRepairAction(validationResult) {
    const { status, confidence, product } = validationResult;

    if (status === VALIDATION_STATES.VALID) {
      return {
        action: REPAIR_ACTIONS.VALID,
        suggestedImageUrl: product.image_url || product.image,
        reason: "Product is already valid; no repair needed"
      };
    }

    if (status === VALIDATION_STATES.MISMATCH ||
        status === VALIDATION_STATES.DUPLICATE_IMAGE ||
        status === VALIDATION_STATES.BROKEN_IMAGE) {
      const verifiedUrl = ProductImageProvider.getVerifiedImage(product);
      return {
        action: REPAIR_ACTIONS.AUTO_FIX,
        suggestedImageUrl: verifiedUrl,
        reason: `Auto-repair image with verified ${product.category} product asset`
      };
    }

    // Borderline / NEEDS_REVIEW cases
    return {
      action: REPAIR_ACTIONS.NEEDS_REVIEW,
      suggestedImageUrl: ProductImageProvider.getVerifiedImage(product),
      reason: `Confidence is ${confidence}; suggest manual review before applying update`
    };
  }

  /**
   * Repair a list of evaluated products
   * @param {object[]} evaluatedProducts - Output from CatalogValidator.validateCatalog()
   * @returns {{ repairedCatalog: object[], repairLog: object[] }}
   */
  static repairCatalog(evaluatedProducts) {
    const repairedCatalog = [];
    const repairLog = [];

    for (const item of evaluatedProducts) {
      const { product, status, confidence, reason } = item;
      const repairPlan = this.evaluateRepairAction(item);

      if (repairPlan.action === REPAIR_ACTIONS.AUTO_FIX) {
        const repaired = {
          ...product,
          image: repairPlan.suggestedImageUrl,
          image_url: repairPlan.suggestedImageUrl,
          _repaired: true,
          _repairReason: reason,
          _previousImage: product.image_url || product.image
        };
        repairedCatalog.push(repaired);
        repairLog.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          status,
          action: REPAIR_ACTIONS.AUTO_FIX,
          previousImage: product.image_url || product.image,
          repairedImage: repairPlan.suggestedImageUrl,
          confidence
        });
      } else {
        repairedCatalog.push({ ...product });
        if (repairPlan.action === REPAIR_ACTIONS.NEEDS_REVIEW) {
          repairLog.push({
            productId: product.id,
            productName: product.name,
            category: product.category,
            status,
            action: REPAIR_ACTIONS.NEEDS_REVIEW,
            previousImage: product.image_url || product.image,
            repairedImage: null,
            confidence
          });
        }
      }
    }

    return { repairedCatalog, repairLog };
  }

  repairCatalog(evaluatedProducts) {
    return CatalogRepair.repairCatalog(evaluatedProducts);
  }
}
