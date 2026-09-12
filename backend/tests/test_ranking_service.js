/**
 * Test Suite: Ranking Service
 * Tests multi-factor relevance scoring, breakdown components, and rank sorting.
 */

import assert from 'assert';
import { RankingService, DEFAULT_RANKING_WEIGHTS } from '../src/services/search/rankingService.js';

async function runTests() {
  console.log('\n── Ranking Service Unit Tests ───────────────────────────');

  const ranker = new RankingService();

  // 1. scoreProduct returns normalized 0-1 float with breakdown
  console.log('Testing scoreProduct...');
  const testProd = {
    id: "P1",
    name: "Cotton Double Bedsheet (Queen)",
    category: "home",
    subcategory: "bedding",
    price: 600,
    rating: 4.8,
    reviews: 1500,
    tags: ["cotton", "bedsheet", "hostel"]
  };

  const scored = ranker.scoreProduct(testProd, {
    semanticSimilarity: 0.85,
    category: "home",
    subcategory: "bedding",
    maxPrice: 1000,
    tags: ["cotton", "hostel"]
  });

  assert.ok(typeof scored.score === 'number', "Score should be a number");
  assert.ok(scored.score >= 0.0 && scored.score <= 1.0, `Score ${scored.score} should be in [0, 1]`);
  assert.ok(scored.breakdown, "Breakdown must exist");
  assert.ok(scored.breakdown.semanticSimilarity >= 0.8, "Semantic similarity should reflect input");
  assert.strictEqual(scored.breakdown.categoryScore, 1.0, "Category match should be 1.0");
  assert.ok(scored.breakdown.priceFitScore >= 0.8, "Price fit within budget should be high");
  console.log('  ✅ scoreProduct returns normalized score with all factor breakdowns');

  // 2. Attribute and tag match calculation
  console.log('Testing tag and attribute matching...');
  const poorMatchProd = {
    id: "P2",
    name: "Plastic Kitchen Container",
    category: "home",
    subcategory: "kitchen",
    price: 300,
    rating: 3.5,
    reviews: 20,
    tags: ["storage", "box"]
  };

  const poorScored = ranker.scoreProduct(poorMatchProd, {
    semanticSimilarity: 0.2,
    category: "electronics",
    subcategory: "audio",
    tags: ["headphones", "bluetooth"]
  });

  assert.ok(scored.score > poorScored.score, `Relevant product score (${scored.score}) should exceed irrelevant product score (${poorScored.score})`);
  console.log('  ✅ Higher relevance context yields higher score than poor match');

  // 3. rankProducts sorting
  console.log('Testing rankProducts sorting...');
  const prodsToRank = [
    poorMatchProd,
    testProd,
    {
      id: "P3",
      name: "Cotton Pillow Pack",
      category: "home",
      subcategory: "bedding",
      price: 450,
      rating: 4.5,
      reviews: 800,
      tags: ["cotton", "pillow"]
    }
  ];

  const ranked = ranker.rankProducts(prodsToRank, {
    category: "home",
    subcategory: "bedding",
    tags: ["cotton", "bedding"]
  });

  assert.strictEqual(ranked.length, 3);
  for (let i = 0; i < ranked.length - 1; i++) {
    assert.ok(ranked[i].score >= ranked[i + 1].score, "Ranked products must be descending by score");
  }
  assert.strictEqual(ranked[2].product.id, "P2", "Least relevant product should be at bottom");
  console.log('  ✅ rankProducts sorts candidate products in strict descending order');

  console.log('\n───────────────────────────────────────────────────────');
  console.log('Ranking Service Tests: ALL PASSED ✅\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
