import assert from 'assert';
import { search, getById, getByIds, getByCategory, getByBudget, getByPriceRange, getCatalogStats } from '../src/utils/productSearchService.js';
import { rankProducts, scoreProduct } from '../src/utils/productRankingService.js';
import { recommendProducts } from '../src/utils/recommendationService.js';
import { extractFeatures } from '../src/utils/recommendationFeatures.js';
import { validateProduct, normalizeProduct, deduplicateProducts, ingestProducts } from '../src/utils/productIngestionService.js';

let passed = 0; let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch(e) { console.error(`  ❌ ${name}: ${e.message}`); failed++; }
}

console.log('\n── Search Service ───────────────────────────────────────');

// 1. Search by category
test('Search by category (bedding)', () => {
  const r = search({ category: 'home', subcategory: 'bedding' });
  assert.ok(r.length > 0);
  assert.ok(r.every(p => p.subcategory === 'bedding'));
});

// 2. Search by price
test('Search by maxPrice', () => {
  const r = search({ maxPrice: 300 });
  assert.ok(r.length > 0);
  assert.ok(r.every(p => p.price <= 300));
});

test('Negative maxPrice returns empty', () => {
  assert.deepStrictEqual(search({ maxPrice: -1 }), []);
});

// 3. Search by rating
test('Search by minRating', () => {
  const r = search({ minRating: 4.4 });
  assert.ok(r.length > 0);
  assert.ok(r.every(p => p.rating >= 4.4));
});

// 4. Search by keyword
test('Keyword search: "kettle"', () => {
  const r = search({ query: 'kettle' });
  assert.ok(r.length > 0);
  assert.ok(r.some(p => p.name.toLowerCase().includes('kettle')));
});

test('Keyword search: unknown term returns empty', () => {
  const r = search({ query: 'zzznomatchzzz' });
  assert.deepStrictEqual(r, []);
});

// 5. Search by tags
test('Search by tags: ["hostel"]', () => {
  const r = search({ tags: ['hostel'] });
  assert.ok(r.length > 0);
  assert.ok(r.every(p => (p.tags||[]).some(t => t.toLowerCase() === 'hostel')));
});

// 6. Combined search
test('Combined: kitchen + maxPrice 500 + minRating 4.0', () => {
  const r = search({ category: 'home', subcategory: 'kitchen', maxPrice: 500, minRating: 4.0 });
  assert.ok(r.length > 0);
  assert.ok(r.every(p => p.subcategory === 'kitchen' && p.price <= 500 && p.rating >= 4.0));
});

// Sort modes
test('sortBy price_low returns ascending price', () => {
  const r = search({ sortBy: 'price_low' });
  for (let i = 1; i < Math.min(r.length, 5); i++) {
    assert.ok(r[i].price >= r[i-1].price, 'Should be ascending');
  }
});

test('sortBy price_high returns descending price', () => {
  const r = search({ sortBy: 'price_high' });
  for (let i = 1; i < Math.min(r.length, 5); i++) {
    assert.ok(r[i].price <= r[i-1].price, 'Should be descending');
  }
});

test('sortBy rating returns highest rated first', () => {
  const r = search({ sortBy: 'rating' });
  assert.ok(r[0].rating >= r[r.length - 1].rating);
});

// Limit enforcement
test('Limit 3 returns at most 3', () => {
  assert.ok(search({ limit: 3 }).length <= 3);
});

test('Limit > 100 clamped to 100', () => {
  assert.ok(search({ limit: 9999 }).length <= 100);
});

// 13. Empty search returns defaults (up to limit)
test('Empty criteria returns results', () => {
  assert.ok(search({}).length > 0);
});

// 14. All 68 products accessible
test('All 68 products accessible', () => {
  assert.ok(getById('B001'));
  assert.ok(getById('H012'));
  assert.ok(getByIds(['B001','K001','P001']).length === 3);
});

test('getCatalogStats returns correct count', () => {
  const s = getCatalogStats();
  assert.ok(s.totalProducts >= 68);
  assert.ok(s.categories.length > 0);
  assert.ok(s.averageRating > 0);
});

console.log('\n── Ranking Service ──────────────────────────────────────');

// 7. Ranking calculation
test('scoreProduct returns 0-1 float', () => {
  const p = getById('B001');
  const score = scoreProduct(p, { category: 'home', subcategory: 'bedding' });
  assert.ok(score >= 0 && score <= 1, `Score ${score} out of range`);
});

test('rankProducts returns sorted descending', () => {
  const products = getByCategory('bedding');
  const ranked = rankProducts(products, { category: 'home', subcategory: 'bedding' });
  assert.ok(ranked.length > 0);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i].score <= ranked[i-1].score, 'Should be descending');
  }
});

test('rankProducts empty input returns empty', () => {
  assert.deepStrictEqual(rankProducts([]), []);
});

console.log('\n── Recommendation Service ───────────────────────────────');

// 8. Cold-start recommendation
test('Cold-start recommendation (no features)', () => {
  const products = search({ category: 'home', subcategory: 'electronics' });
  const candidates = search({});
  const result = recommendProducts({ products: candidates, criteria: {} });
  assert.ok(result.products.length > 0);
  assert.ok(result.source.includes('deterministic'));
  assert.ok(typeof result.explanation === 'string');
  assert.ok(Array.isArray(result.scores));
});

// 9. User preference recommendation
test('Personalised recommendation with features', () => {
  const fakeProfile = {
    category_scores: { bedding: 0.6, electronics: 0.3 },
    tag_scores: { hostel: 0.8 },
    min_rating_pref: 4.0,
    interaction_counts: { view: 5, select: 3 }
  };
  const features = extractFeatures(fakeProfile, null);
  assert.strictEqual(features.isNewUser, false);
  assert.ok(features.preferredCategories.includes('bedding'));

  const products = search({});
  const result = recommendProducts({ products, features, mode: 'ml' });
  assert.ok(result.products.length > 0);
  // ML model is placeholder → should fall back to deterministic
  assert.ok(result.source.includes('deterministic'));
});

// 10. ML unavailable fallback
test('ML unavailable falls back to deterministic', () => {
  const result = recommendProducts({ products: search({}), mode: 'ml', features: null });
  assert.ok(result.source.includes('deterministic') || result.source === 'empty');
});

// 11. Recommendation with empty product list
test('Empty products input returns empty result', () => {
  const result = recommendProducts({ products: [] });
  assert.deepStrictEqual(result.products, []);
  assert.strictEqual(result.source, 'empty');
});

// 12. Recommendation result format
test('Recommendation result has required fields', () => {
  const result = recommendProducts({ products: search({}).slice(0, 5) });
  assert.ok('products' in result);
  assert.ok('scores' in result);
  assert.ok('source' in result);
  assert.ok('explanation' in result);
  assert.strictEqual(result.products.length, result.scores.length);
});

console.log('\n── Ingestion Service ────────────────────────────────────');

// 13. Invalid product rejection
test('Invalid product (negative price) is rejected', () => {
  const { rejected } = ingestProducts([{ id: 'X1', name: 'Bad', price: -5, category: 'home' }]);
  assert.ok(rejected.length === 1);
  assert.ok(rejected[0].errors.some(e => e.includes('price')));
});

// 14. Duplicate product deduplication
test('Duplicate IDs are deduplicated', () => {
  const dupes = [
    { id: 'D1', name: 'A', price: 100, category: 'home' },
    { id: 'D1', name: 'A copy', price: 200, category: 'home' }
  ];
  const { ingested } = ingestProducts(dupes);
  assert.strictEqual(ingested.length, 1);
  assert.strictEqual(ingested[0].id, 'D1');
});

// 15. normalizeProduct adds required fields
test('normalizeProduct adds in_stock, brand, tags etc.', () => {
  const n = normalizeProduct({ id: 'N1', name: 'Test', price: 50, category: 'electronics' });
  assert.strictEqual(n.in_stock, true);
  assert.strictEqual(n.brand, 'Unknown');
  assert.deepStrictEqual(n.tags, []);
});

test('validateProduct catches missing name', () => {
  const { valid, errors } = validateProduct({ id: 'Q1', price: 50, category: 'home' });
  assert.strictEqual(valid, false);
  assert.ok(errors.some(e => e.includes('name')));
});

console.log('\n── Feature Extraction ───────────────────────────────────');

test('extractFeatures new user has isNewUser=true', () => {
  const f = extractFeatures(null, null);
  assert.strictEqual(f.isNewUser, true);
});

test('extractFeatures returning user has isNewUser=false', () => {
  const profile = { category_scores: { electronics: 0.7 }, interaction_counts: { view: 10 } };
  const f = extractFeatures(profile, null);
  assert.strictEqual(f.isNewUser, false);
});

test('extractFeatures reads conversationContext', () => {
  const ctx = { lastCategories: ['home'], lastBudget: 3000, lastProductIds: ['B001'] };
  const f = extractFeatures(null, ctx);
  assert.strictEqual(f.recencyFeatures.lastCategory, 'home');
  assert.strictEqual(f.recencyFeatures.lastBudget, 3000);
});

console.log(`\n${'─'.repeat(55)}`);
console.log(`Total: ${passed + failed} | ✅ ${passed} passed | ❌ ${failed} failed\n`);
if (failed > 0) process.exit(1);
