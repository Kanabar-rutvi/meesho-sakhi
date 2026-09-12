/**
 * Catalog Intelligence Module Entry Point
 */

export { VisionProvider, HeuristicVisionProvider, HuggingFaceVisionProvider, getVisionProvider } from './visionProvider.js';
export { ProductImageProvider, VERIFIED_PRODUCT_IMAGES } from './productImageProvider.js';
export { ImageValidator } from './imageValidator.js';
export { ProductClassifier } from './productClassifier.js';
export { DuplicateDetector } from './duplicateDetector.js';
export { ConfidenceScorer, VALIDATION_STATES, DEFAULT_THRESHOLDS } from './confidenceScorer.js';
export { CatalogRepair, REPAIR_ACTIONS } from './catalogRepair.js';
export { CatalogReport } from './catalogReport.js';
export { CatalogValidator } from './catalogValidator.js';
export { CatalogImageValidator, catalogImageValidator, IMAGE_VALIDATION_STATUS } from './catalogImageValidator.js';
