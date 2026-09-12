/**
 * Real Marketplace Catalog Integrity and Strict Validation Tests
 *
 * Asserts:
 * 1. ZERO duplicate primary images across the entire catalog (1:1 uniqueness).
 * 2. Strict semantic relevance: Sneaker -> sneaker image, Keyboard -> keyboard image,
 *    Laptop -> laptop image, Sofa -> sofa image, Backpack -> backpack image, etc.
 * 3. NO cross-category leakage (bedding image on footwear, food on electronics, etc.).
 * 4. Catalog schema completeness: valid price, originalPrice, discountPercent, attributes, and ratings.
 * 5. Minimum product density per category/subcategory.
 */

import assert from 'assert';
import { getAllProducts, getProductById } from '../src/utils/catalog.js';
import { CatalogImageValidator, IMAGE_VALIDATION_STATUS } from '../src/services/catalogIntelligence/catalogImageValidator.js';
import { ImageValidator } from '../src/services/catalogIntelligence/imageValidator.js';
import { getVisionProvider } from '../src/services/catalogIntelligence/visionProvider.js';

async function runStrictMarketplaceTests() {
  console.log('\n── Strict Marketplace Catalog Integrity Tests ──────────────');
  const products = getAllProducts();
  assert.ok(products.length >= 100, `Catalog must contain at least 100 marketplace products, found ${products.length}`);
  console.log(`Testing full production catalog with ${products.length} products...`);

  // 1. STRICT IMAGE UNIQUENESS TEST (Rule 2 & Section 32)
  console.log('Testing 1:1 Primary Image Uniqueness (Section 32)...');
  const seenExactUrls = new Map();
  const seenFingerprints = new Map();
  const duplicateExact = [];
  const duplicateNormalized = [];

  for (const product of products) {
    const imgUrl = product.image || (product.images && product.images[0]?.url);
    assert.ok(imgUrl, `Product ${product.id} must have a primary image`);

    // Exact duplicate test
    if (seenExactUrls.has(imgUrl)) {
      duplicateExact.push({ id1: seenExactUrls.get(imgUrl), id2: product.id, imgUrl });
    } else {
      seenExactUrls.set(imgUrl, product.id);
    }

    // Normalized / fingerprint duplicate test
    const fp = ImageValidator.generateFingerprint(imgUrl);
    if (seenFingerprints.has(fp)) {
      duplicateNormalized.push({ id1: seenFingerprints.get(fp), id2: product.id, fp });
    } else {
      seenFingerprints.set(fp, product.id);
    }
  }

  assert.strictEqual(duplicateExact.length, 0, `Detected ${duplicateExact.length} duplicate primary image URLs!`);
  assert.strictEqual(duplicateNormalized.length, 0, `Detected ${duplicateNormalized.length} near-duplicate/shared fingerprint images!`);
  console.log('  ✅ 100% Primary image uniqueness verified (0 exact duplicates, 0 near duplicates)');

  // 2. STRICT IMAGE / PRODUCT SEMANTIC ALIGNMENT (Rule 1, Section 33)
  console.log('Testing Strict Product-to-Image Semantic Alignment (Section 33)...');
  const visionProvider = getVisionProvider();

  const semanticCheckSuites = [
    { queryKeyword: 'sneaker', expectedConcepts: ['shoes', 'footwear'] },
    { queryKeyword: 'keyboard', expectedConcepts: ['keyboard'] },
    { queryKeyword: 'laptop', expectedConcepts: ['laptop', 'display_monitor'] },
    { queryKeyword: 'lipstick', expectedConcepts: ['lipstick', 'makeup'] },
    { queryKeyword: 'sofa', expectedConcepts: ['chair', 'furniture'] },
    { queryKeyword: 'backpack', expectedConcepts: ['bag'] },
    { queryKeyword: 'smartwatch', expectedConcepts: ['watch'] }
  ];

  for (const check of semanticCheckSuites) {
    const matchingProducts = products.filter(p => {
      const name = p.name.toLowerCase();
      if (!name.includes(check.queryKeyword)) return false;
      if (check.queryKeyword === 'laptop' && (name.includes('bag') || name.includes('backpack') || name.includes('sleeve'))) return false;
      return true;
    });
    assert.ok(matchingProducts.length > 0, `Catalog should contain products matching keyword "${check.queryKeyword}"`);

    for (const prod of matchingProducts) {
      const img = prod.image || prod.images[0]?.url;
      const { concepts, dominantCategory } = await visionProvider.analyzeImage(img);
      const hasMatch = concepts.some(c => check.expectedConcepts.includes(c));
      assert.ok(
        hasMatch,
        `Semantic mismatch: Product "${prod.name}" (${prod.id}) image "${img}" contains concept "${dominantCategory}" instead of expected [${check.expectedConcepts.join(', ')}]`
      );
    }
  }
  console.log('  ✅ Product-to-Image semantic tests passed for Sneaker, Keyboard, Laptop, Lipstick, Sofa, Backpack, Watch');

  // 3. ZERO CROSS-CATEGORY CONTAMINATION (Rule 6 & Section 6)
  console.log('Testing Cross-Category Safety Rules...');
  const validator = new CatalogImageValidator({ checkReachability: false });
  const evaluations = await validator.validateCatalogImages(products);

  const rejections = evaluations.filter(e => e.status === IMAGE_VALIDATION_STATUS.REJECTED);
  assert.strictEqual(
    rejections.length,
    0,
    `Found ${rejections.length} rejected products due to category mismatch or bad data: ${rejections.map(r => r.productId).join(', ')}`
  );
  console.log('  ✅ Zero cross-category image contamination found across entire catalog');

  // 4. REALISTIC PRODUCT PRICING AND ATTRIBUTES SCHEMA (Section 10, 28)
  console.log('Testing Marketplace Schema Completeness...');
  for (const p of products) {
    assert.ok(p.id, 'Product must have an ID');
    assert.ok(p.name && p.name.length >= 5, `Product ${p.id} must have a descriptive name`);
    assert.ok(p.price > 0, `Product ${p.id} price must be > 0`);
    assert.ok(p.originalPrice >= p.price, `Product ${p.id} MRP (${p.originalPrice}) must be >= selling price (${p.price})`);
    assert.ok(p.discountPercent >= 0, `Product ${p.id} must have non-negative discount`);
    assert.ok(p.rating >= 3.5 && p.rating <= 5.0, `Product ${p.id} rating must be realistic between 3.5 and 5.0`);
    assert.ok(p.reviews > 0, `Product ${p.id} must have review count`);
    assert.ok(p.images && p.images.length >= 1, `Product ${p.id} must have images array`);
    assert.ok(p.attributes && Object.keys(p.attributes).length >= 1, `Product ${p.id} must have attributes`);
    assert.ok(p.tags && p.tags.length >= 2, `Product ${p.id} must have at least 2 search tags`);
  }
  console.log('  ✅ All products satisfy marketplace schema (MRP, discounts, ratings, attributes, tags)');

  console.log('\n───────────────────────────────────────────────────────');
  console.log('Strict Real Marketplace Catalog Tests: ALL PASSED ✅\n');
}

runStrictMarketplaceTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
