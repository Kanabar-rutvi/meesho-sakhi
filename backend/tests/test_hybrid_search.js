/**
 * Test Suite: Hybrid Search Service
 * Tests candidate retrieval, semantic matching, constraints, and ranking.
 */

import assert from 'assert';
import { hybridSearchService } from '../src/services/search/hybridSearchService.js';

async function runTests() {
  console.log('\n── Hybrid Search Service Tests ─────────────────────────');

  await hybridSearchService.ensureInitialized();

  // 1. Natural language query: "shoes under 1500"
  console.log('Testing natural language query with budget constraint...');
  const shoesSearch = await hybridSearchService.search({
    query: "shoes under 1500",
    maxPrice: 1500,
    limit: 10
  });

  assert.ok(shoesSearch.products.length > 0, "Should retrieve shoe products");
  for (const p of shoesSearch.products) {
    assert.ok(p.price <= 1500, `Product ${p.name} price ${p.price} must be <= 1500`);
    const isFootwear = (p.category === 'fashion' || (p.subcategory || '').toLowerCase() === 'footwear' || (p.tags || []).some(t => t.includes('shoe') || t.includes('footwear')));
    assert.ok(isFootwear, `Product ${p.name} should be in footwear or fashion`);
  }
  console.log('  ✅ "shoes under 1500" returns footwear products strictly within budget');

  // 2. Query: "gaming keyboard"
  console.log('Testing query: "gaming keyboard"...');
  const kbSearch = await hybridSearchService.search({
    query: "gaming keyboard",
    limit: 5
  });
  assert.ok(kbSearch.products.length > 0, "Should find keyboard products");
  const topKb = kbSearch.products[0];
  assert.ok(topKb.name.toLowerCase().includes('keyboard') || (topKb.tags || []).includes('keyboard'), 'Top result should be keyboard');
  assert.ok(kbSearch.rankedItems[0].score > 0.5, 'Relevance score should be significant');
  console.log('  ✅ "gaming keyboard" retrieves relevant electronics peripheral items');

  // 3. Category & Subcategory filtering: "bedding"
  console.log('Testing category filter: "bedding"...');
  const beddingSearch = await hybridSearchService.search({
    category: "home",
    subcategory: "bedding",
    limit: 10
  });
  assert.ok(beddingSearch.products.length > 0, "Should find bedding items");
  for (const p of beddingSearch.products) {
    assert.strictEqual(p.category.toLowerCase(), 'home');
    assert.strictEqual(p.subcategory.toLowerCase(), 'bedding');
  }
  console.log('  ✅ Category and subcategory filtering accurately isolates products');

  // 4. Rating constraint: minRating 4.5
  console.log('Testing minRating constraint...');
  const ratingSearch = await hybridSearchService.search({
    minRating: 4.5,
    limit: 15
  });
  assert.ok(ratingSearch.products.length > 0, "Should find high rated products");
  for (const p of ratingSearch.products) {
    assert.ok(p.rating >= 4.5, `Product ${p.name} rating ${p.rating} must be >= 4.5`);
  }
  console.log('  ✅ minRating constraint strictly enforces minimum rating');

  // 5. Sorting: price_low vs price_high
  console.log('Testing sort orders...');
  const lowPriceSearch = await hybridSearchService.search({
    category: "fashion",
    sortBy: "price_low",
    limit: 10
  });
  for (let i = 0; i < lowPriceSearch.products.length - 1; i++) {
    assert.ok(lowPriceSearch.products[i].price <= lowPriceSearch.products[i + 1].price, "Should be ascending price order");
  }

  const highPriceSearch = await hybridSearchService.search({
    category: "fashion",
    sortBy: "price_high",
    limit: 10
  });
  for (let i = 0; i < highPriceSearch.products.length - 1; i++) {
    assert.ok(highPriceSearch.products[i].price >= highPriceSearch.products[i + 1].price, "Should be descending price order");
  }
  console.log('  ✅ Sorting by price_low and price_high functions properly');

  // 6. Metadata and candidate count
  console.log('Testing metadata reporting...');
  assert.ok(shoesSearch.queryMetadata, "Query metadata should be present");
  assert.ok(shoesSearch.rankedItems.length > 0, "Ranked items should include score and breakdown");
  assert.ok(shoesSearch.rankedItems[0].breakdown, "Score breakdown must exist");
  console.log('  ✅ Hybrid search returns explainable rankedItems and query metadata');

  console.log('\n───────────────────────────────────────────────────────');
  console.log('Hybrid Search Tests: ALL PASSED ✅\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
