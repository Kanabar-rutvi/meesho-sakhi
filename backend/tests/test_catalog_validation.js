/**
 * Test Suite: Catalog Validation & Repair
 * Tests multi-modal heuristic validation, confidence scoring, duplicate detection, and automated repair.
 */

import assert from 'assert';
import {
  CatalogValidator,
  CatalogRepair,
  CatalogReport,
  HeuristicVisionProvider,
  DuplicateDetector,
  ConfidenceScorer,
  VALIDATION_STATES
} from '../src/services/catalogIntelligence/index.js';

async function runTests() {
  console.log('\n── Catalog Intelligence & Validation Tests ──────────────');

  // 1. Vision Provider heuristics
  console.log('Testing HeuristicVisionProvider...');
  const vision = new HeuristicVisionProvider();
  
  const redShoesAnalysis = await vision.analyzeImage('https://images.unsplash.com/photo-red-running-shoes-1234?auto=format');
  assert.ok(redShoesAnalysis.concepts.includes('shoes'), 'Should detect shoes concept from URL');
  assert.strictEqual(redShoesAnalysis.dominantCategory, 'shoes');

  const bedsheetAnalysis = await vision.analyzeImage('https://images.unsplash.com/photo-cotton-double-bedsheet-queen?auto=format');
  assert.ok(bedsheetAnalysis.concepts.includes('bedding'), 'Should detect bedding concept');
  assert.strictEqual(bedsheetAnalysis.dominantCategory, 'bedding');
  console.log('  ✅ HeuristicVisionProvider extracts concept and semantic categories');

  // 2. Duplicate Image Detection
  console.log('Testing DuplicateDetector...');
  const testProds = [
    { id: 'T1', name: 'Product One', image: 'https://images.unsplash.com/photo-shared-101' },
    { id: 'T2', name: 'Product Two (Duplicate)', image: 'https://images.unsplash.com/photo-shared-101' },
    { id: 'T3', name: 'Product Three (Unique)', image: 'https://images.unsplash.com/photo-unique-202' }
  ];

  const dupMap = DuplicateDetector.buildDuplicateMap(testProds);
  assert.strictEqual(dupMap.size, 2, 'Should have 2 unique image fingerprints');
  const t2Check = DuplicateDetector.checkProductDuplicate(testProds[1], dupMap);
  assert.strictEqual(t2Check.isDuplicate, true, 'Product T2 should be flagged as duplicate');
  assert.ok(t2Check.sharedWith.includes('T1'), 'Should share image with T1');
  console.log('  ✅ DuplicateDetector flags identical image fingerprints');

  // 3. Confidence Scorer states
  console.log('Testing ConfidenceScorer...');
  const scorer = new ConfidenceScorer();

  // Clean valid product
  const validResult = scorer.score({
    product: { id: 'V1', name: 'Running Shoes', category: 'fashion', subcategory: 'footwear', tags: ['shoes'] },
    isReachable: true,
    visualSimilarity: 0.9,
    categoryConsistent: true,
    isDuplicate: false
  });
  assert.strictEqual(validResult.status, VALIDATION_STATES.VALID);
  assert.ok(validResult.confidence >= 0.75, 'Valid product should have high confidence');

  // Broken image
  const brokenResult = scorer.score({
    product: { id: 'B1', name: 'Kettle', category: 'home', subcategory: 'kitchen' },
    isReachable: false,
    visualSimilarity: 0.0,
    isDuplicate: false
  });
  assert.strictEqual(brokenResult.status, VALIDATION_STATES.BROKEN_IMAGE);

  // Mismatched category (e.g. fashion product showing electronics)
  const mismatchResult = scorer.score({
    product: { id: 'M1', name: 'Floral Kurta', category: 'fashion', subcategory: 'womens_clothing' },
    isReachable: true,
    visualSimilarity: 0.1,
    categoryConsistent: false,
    isDuplicate: false
  });
  assert.strictEqual(mismatchResult.status, VALIDATION_STATES.MISMATCH);
  console.log('  ✅ ConfidenceScorer correctly classifies VALID, BROKEN_IMAGE, and MISMATCH');

  // 4. Catalog Validator on mini catalog
  console.log('Testing CatalogValidator...');
  const validator = new CatalogValidator({ checkReachability: false });
  const sampleCatalog = [
    { id: 'S1', name: 'Sneakers Red', category: 'fashion', subcategory: 'footwear', image: 'https://images.unsplash.com/photo-red-sneakers-shoes?auto=format' },
    { id: 'S2', name: 'Non-Stick Cooking Pan', category: 'home', subcategory: 'kitchen', image: 'https://images.unsplash.com/photo-kitchen-cooking-frying-pan?auto=format' },
    { id: 'S3', name: 'Silk Banarasi Saree', category: 'fashion', subcategory: 'womens_clothing', image: 'https://images.unsplash.com/photo-laptop-macbook-xps-laptop?auto=format' }
  ];

  const evaluations = await validator.validateCatalog(sampleCatalog);
  const reportData = CatalogReport.buildReportData(evaluations);
  assert.strictEqual(reportData.summary.totalProducts, 3);
  assert.ok(reportData.summary.validProducts >= 2);
  assert.strictEqual(reportData.summary.mismatchedImages, 1);
  console.log('  ✅ CatalogValidator produces complete summary and diagnostics');

  // 5. Catalog Repair Workflow
  console.log('Testing CatalogRepair...');
  const repair = new CatalogRepair();
  const repairReport = repair.repairCatalog(evaluations);
  assert.ok(repairReport.repairedCatalog.length === 3);
  const repairedS3 = repairReport.repairedCatalog.find(p => p.id === 'S3');
  assert.ok(repairedS3.image.startsWith('http') && !repairedS3.image.includes('laptop'), 'Should assign high-quality clothing image and remove laptop image');
  console.log('  ✅ CatalogRepair replaces mismatched image with verified asset');

  console.log('\n───────────────────────────────────────────────────────');
  console.log('Catalog Validation Tests: ALL PASSED ✅\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
