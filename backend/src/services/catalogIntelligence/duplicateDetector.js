/**
 * Duplicate Detector Service
 *
 * Discovers duplicate image usage across the product catalog.
 * Differentiates genuine variants from invalid image collisions.
 */

import { ImageValidator } from './imageValidator.js';

export class DuplicateDetector {
  /**
   * Build a duplicate map for a full catalog of products
   * @param {object[]} products
   * @returns {Map<string, { fingerprint: string, productIds: string[], count: number }>}
   */
  static buildDuplicateMap(products) {
    const fingerprintMap = new Map();

    for (const prod of products) {
      const url = prod.image_url || prod.image;
      if (!url) continue;

      const fp = ImageValidator.generateFingerprint(url);
      if (!fp) continue;

      if (!fingerprintMap.has(fp)) {
        fingerprintMap.set(fp, {
          fingerprint: fp,
          productIds: [],
          count: 0
        });
      }

      const entry = fingerprintMap.get(fp);
      entry.productIds.push(prod.id);
      entry.count++;
    }

    return fingerprintMap;
  }

  /**
   * Check if a product's image is a duplicate of another product
   * @param {object} product
   * @param {Map<string, object>} duplicateMap
   * @param {Map<string, object>} [productByIdMap]
   * @returns {{ isDuplicate: boolean, sharedWith: string[], penalty: number }}
   */
  static checkProductDuplicate(product, duplicateMap, productByIdMap = null) {
    const url = product.image_url || product.image;
    if (!url) return { isDuplicate: false, sharedWith: [], penalty: 0 };

    const fp = ImageValidator.generateFingerprint(url);
    const entry = duplicateMap.get(fp);

    if (entry && entry.count > 1) {
      const otherIds = entry.productIds.filter(id => id !== product.id);

      // Check if they are genuine variants (same brand and category or same base product name)
      if (productByIdMap) {
        const nonVariants = otherIds.filter(otherId => {
          const other = productByIdMap.get(otherId);
          if (!other) return true;
          // Genuine variants share category and significant title overlap
          const sameCat = (other.category || '').toLowerCase() === (product.category || '').toLowerCase();
          const pBase = (product.name || '').split(' ')[0].toLowerCase();
          const oBase = (other.name || '').split(' ')[0].toLowerCase();
          return !(sameCat && pBase === oBase);
        });

        if (nonVariants.length > 0) {
          return {
            isDuplicate: true,
            sharedWith: nonVariants,
            penalty: 0.35
          };
        }

        // Legitimate variants sharing image
        return { isDuplicate: false, sharedWith: otherIds, penalty: 0.0 };
      }

      return {
        isDuplicate: otherIds.length > 0,
        sharedWith: otherIds,
        penalty: 0.35
      };
    }

    return { isDuplicate: false, sharedWith: [], penalty: 0 };
  }
}

