/**
 * Catalog Validator Pipeline
 *
 * Coordinates image reachability, vision analysis, taxonomy classification,
 * duplicate detection, and confidence scoring across every product in the catalog.
 */

import { getVisionProvider } from './visionProvider.js';
import { ImageValidator } from './imageValidator.js';
import { ProductClassifier } from './productClassifier.js';
import { DuplicateDetector } from './duplicateDetector.js';
import { ConfidenceScorer } from './confidenceScorer.js';

export class CatalogValidator {
  constructor(options = {}) {
    this.visionProvider = options.visionProvider || getVisionProvider();
    this.confidenceScorer = options.confidenceScorer || new ConfidenceScorer(options.thresholds);
    this.checkReachability = options.checkReachability !== undefined ? options.checkReachability : true;
  }

  /**
   * Validate an entire catalog of products
   * @param {object[]} products
   * @param {object} options
   * @returns {Promise<object[]>} evaluated results for each product
   */
  async validateCatalog(products, options = {}) {
    if (!Array.isArray(products)) {
      throw new Error("CatalogValidator.validateCatalog: products must be an array");
    }

    const duplicateMap = DuplicateDetector.buildDuplicateMap(products);
    const productByIdMap = new Map(products.map(p => [p.id, p]));
    const evaluatedResults = [];

    for (const product of products) {
      const evaluation = await this.validateProduct(product, duplicateMap, { ...options, productByIdMap });
      evaluatedResults.push(evaluation);
    }

    return evaluatedResults;
  }

  /**
   * Validate a single product
   * @param {object} product
   * @param {Map<string, object>} [duplicateMap]
   * @param {object} [options]
   * @returns {Promise<object>} evaluation result
   */
  async validateProduct(product, duplicateMap = null, options = {}) {
    const imageUrl = product.image_url || product.image;

    // 1. Duplicate detection
    let isDuplicate = false;
    let sharedWith = [];

    if (duplicateMap) {
      const dupCheck = DuplicateDetector.checkProductDuplicate(product, duplicateMap, options.productByIdMap);
      isDuplicate = dupCheck.isDuplicate;
      sharedWith = dupCheck.sharedWith;
    }

    // 2. Reachability check
    let isReachable = true;
    let reachabilityReason = "OK";

    if (this.checkReachability && imageUrl) {
      // In fast test mode or offline, treat syntactically valid HTTP/HTTPS URLs as reachable if ping disabled
      if (options.fastMode) {
        isReachable = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
      } else {
        const probe = await ImageValidator.verifyUrl(imageUrl, options.timeoutMs || 2500);
        isReachable = probe.reachable;
        reachabilityReason = probe.reason;
      }
    } else if (!imageUrl) {
      isReachable = false;
      reachabilityReason = "Missing image URL";
    }

    // 3. Category & Taxonomy consistency
    const taxonomyResult = ProductClassifier.classify(product);
    const categoryConsistent = (
      !product.category ||
      taxonomyResult.category.toLowerCase() === product.category.toLowerCase() ||
      product.category.toLowerCase().includes(taxonomyResult.category.toLowerCase()) ||
      taxonomyResult.category.toLowerCase().includes(product.category.toLowerCase())
    );

    // 4. Visual semantic similarity
    let visualSimilarity = 0.5;
    let visualReason = "";
    let visualConcepts = [];

    if (imageUrl && isReachable) {
      const visualMatch = await this.visionProvider.calculateVisualSemanticMatch(product, imageUrl);
      visualSimilarity = visualMatch.similarity;
      visualReason = visualMatch.reason;
      visualConcepts = visualMatch.visualConcepts;
    } else {
      visualSimilarity = 0.0;
      visualReason = reachabilityReason;
    }

    // 5. Compute confidence score and validation status
    const scoringResult = this.confidenceScorer.score({
      product,
      isReachable,
      visualSimilarity,
      visualReason,
      isDuplicate,
      duplicateWith: sharedWith,
      categoryConsistent
    });

    return {
      product,
      status: scoringResult.status,
      confidence: scoringResult.confidence,
      reason: scoringResult.reason,
      visualConcepts,
      isDuplicate,
      sharedWith,
      breakdown: scoringResult.breakdown
    };
  }
}
