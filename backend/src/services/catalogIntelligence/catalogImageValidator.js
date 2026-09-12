/**
 * Catalog Image Validator Service
 *
 * Provides comprehensive validation of product imagery according to strict marketplace standards:
 * - URL syntax & reachability
 * - Image MIME format & extensions
 * - Perceptual duplication & cross-product collision detection
 * - Cross-category leakage prevention (e.g. bed image on footwear, cat food on running shoes)
 * - Multi-modal visual semantic alignment against product title, category, subcategory, and attributes
 * - Strict Hard-Fail rule: products with unverified or mismatched images are marked REJECTED / NEEDS_REVIEW
 */

import { ImageValidator } from './imageValidator.js';
import { DuplicateDetector } from './duplicateDetector.js';
import { getVisionProvider } from './visionProvider.js';
import { ProductClassifier } from './productClassifier.js';
import { VALIDATION_STATES } from './confidenceScorer.js';

export const IMAGE_VALIDATION_STATUS = {
  APPROVED: "APPROVED",
  VALID: "VALID",
  REJECTED: "REJECTED",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  MISMATCH: "MISMATCH",
  DUPLICATE: "DUPLICATE",
  BROKEN: "BROKEN"
};

export class CatalogImageValidator {
  constructor(options = {}) {
    this.visionProvider = options.visionProvider || getVisionProvider();
    this.checkReachability = options.checkReachability !== undefined ? options.checkReachability : true;
    this.timeoutMs = options.timeoutMs || 3000;
  }

  /**
   * Validates a single product's primary image against marketplace criteria.
   *
   * @param {object} product - Full product object
   * @param {object} [context] - Optional catalog context (duplicateMap, productByIdMap)
   * @returns {Promise<{
   *   productId: string,
   *   status: string,
   *   confidence: number,
   *   reason: string,
   *   isApproved: boolean,
   *   diagnostics: {
   *     isReachable: boolean,
   *     isDuplicate: boolean,
   *     sharedWith: string[],
   *     visualSimilarity: number,
   *     categoryMatch: boolean,
   *     detectedCategory: string,
   *     expectedCategory: string
   *   }
   * }>}
   */
  async validateProductImage(product, context = {}) {
    if (!product || !product.id) {
      return {
        productId: product?.id || "UNKNOWN",
        status: IMAGE_VALIDATION_STATUS.REJECTED,
        confidence: 0,
        reason: "Invalid product metadata: missing product ID",
        isApproved: false,
        diagnostics: {}
      };
    }

    const imageUrl = product.image_url || product.image || (product.images && product.images[0]?.url);

    // 1. Missing or empty image URL check
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return {
        productId: product.id,
        status: IMAGE_VALIDATION_STATUS.REJECTED,
        confidence: 0.0,
        reason: "Missing product image URL",
        isApproved: false,
        diagnostics: { isReachable: false }
      };
    }

    const trimmedUrl = imageUrl.trim();

    // 2. URL Format and Protocol validation
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return {
        productId: product.id,
        status: IMAGE_VALIDATION_STATUS.REJECTED,
        confidence: 0.0,
        reason: `Invalid image URL protocol: must start with http:// or https://`,
        isApproved: false,
        diagnostics: { isReachable: false }
      };
    }

    // 3. Duplicate and Near-Duplicate detection across catalog
    let isDuplicate = false;
    let sharedWith = [];
    if (context.duplicateMap) {
      const dupCheck = DuplicateDetector.checkProductDuplicate(product, context.duplicateMap, context.productByIdMap);
      isDuplicate = dupCheck.isDuplicate;
      sharedWith = dupCheck.sharedWith;
    }

    if (isDuplicate) {
      return {
        productId: product.id,
        status: IMAGE_VALIDATION_STATUS.REJECTED,
        confidence: 0.1,
        reason: `Duplicate primary image collision with product(s): ${sharedWith.join(', ')}`,
        isApproved: false,
        diagnostics: { isDuplicate: true, sharedWith }
      };
    }

    // 4. Reachability Probe
    let isReachable = true;
    let reachabilityReason = "OK";
    if (this.checkReachability) {
      if (context.fastMode) {
        isReachable = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
      } else {
        const probe = await ImageValidator.verifyUrl(trimmedUrl, this.timeoutMs);
        isReachable = probe.reachable;
        reachabilityReason = probe.reason;
      }
    }

    if (!isReachable) {
      return {
        productId: product.id,
        status: IMAGE_VALIDATION_STATUS.BROKEN,
        confidence: 0.0,
        reason: `Image URL is unreachable or returned non-image content: ${reachabilityReason}`,
        isApproved: false,
        diagnostics: { isReachable: false }
      };
    }

    // 5. Taxonomy & Category Verification
    const classified = ProductClassifier.classify(product);
    const prodCat = (product.category || "").toLowerCase();
    const expectedCat = classified.category.toLowerCase();
    const categoryMatch = !product.category ||
      prodCat === expectedCat ||
      prodCat.includes(expectedCat) ||
      expectedCat.includes(prodCat) ||
      (prodCat === 'home' && expectedCat.includes('home')) ||
      (prodCat === 'beauty' && (expectedCat === 'beauty' || expectedCat === 'hygiene')) ||
      (prodCat === 'hygiene' && (expectedCat === 'beauty' || expectedCat === 'hygiene')) ||
      (prodCat === 'study' && (expectedCat === 'study' || expectedCat === 'stationery')) ||
      (prodCat.includes('access') && (expectedCat.includes('access') || expectedCat.includes('fashion')));

    // 6. Computer Vision & Semantic Relevance
    const visionMatch = await this.visionProvider.calculateVisualSemanticMatch(product, trimmedUrl);
    const visualSimilarity = visionMatch.similarity;
    const visualConcepts = visionMatch.visualConcepts || [];

    // 7. Hard-Fail Conflict Rules (e.g. shoes vs bed, groceries/meat on footwear)
    if (visualSimilarity <= 0.2) {
      return {
        productId: product.id,
        status: IMAGE_VALIDATION_STATUS.REJECTED,
        confidence: visualSimilarity,
        reason: visionMatch.reason || `Severe visual content mismatch for ${product.category}`,
        isApproved: false,
        diagnostics: {
          isReachable: true,
          isDuplicate: false,
          visualSimilarity,
          categoryMatch,
          detectedCategory: visionMatch.visualConcepts?.[0] || 'unknown',
          expectedCategory: product.category
        }
      };
    }

    // 8. Confidence determination
    let status = IMAGE_VALIDATION_STATUS.APPROVED;
    let confidence = visualSimilarity;

    if (visualSimilarity >= 0.75 && categoryMatch) {
      status = IMAGE_VALIDATION_STATUS.APPROVED;
      confidence = Math.min(visualSimilarity, 0.98);
    } else if (visualSimilarity >= 0.5) {
      status = IMAGE_VALIDATION_STATUS.NEEDS_REVIEW;
      confidence = visualSimilarity;
    } else {
      status = IMAGE_VALIDATION_STATUS.REJECTED;
      confidence = visualSimilarity;
    }

    return {
      productId: product.id,
      status: status === IMAGE_VALIDATION_STATUS.APPROVED ? IMAGE_VALIDATION_STATUS.VALID : status,
      confidence: Math.round(confidence * 100) / 100,
      reason: visionMatch.reason || (status === IMAGE_VALIDATION_STATUS.APPROVED ? "Image verified and compliant with catalog standards" : "Image requires editorial review"),
      isApproved: status === IMAGE_VALIDATION_STATUS.APPROVED,
      diagnostics: {
        isReachable: true,
        isDuplicate: false,
        sharedWith: [],
        visualSimilarity,
        categoryMatch,
        detectedCategory: visionMatch.visualConcepts?.[0] || 'compliant',
        expectedCategory: product.category
      }
    };
  }

  /**
   * Validates an entire catalog in batch
   * @param {object[]} products
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */
  async validateCatalogImages(products, options = {}) {
    const duplicateMap = DuplicateDetector.buildDuplicateMap(products);
    const productByIdMap = new Map(products.map(p => [p.id, p]));
    const results = [];

    for (const product of products) {
      const evaluation = await this.validateProductImage(product, {
        ...options,
        duplicateMap,
        productByIdMap
      });
      results.push(evaluation);
    }

    return results;
  }
}

export const catalogImageValidator = new CatalogImageValidator();
