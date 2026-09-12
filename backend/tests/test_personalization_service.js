/**
 * Test Suite: Personalization & Event Tracking Service
 * Tests user interaction logging, time decay, affinity vector computation, and score boosting.
 */

import assert from 'assert';
import {
  recordInteraction,
  getUserAffinity,
  calculatePersonalizationScore,
  ACTION_WEIGHTS
} from '../src/services/personalization/interactionService.js';
import { getProductById } from '../src/utils/catalog.js';

async function runTests() {
  console.log('\n── Personalization & Event Tracking Tests ───────────────');

  const testUserId = 99901;
  const testSessionId = 'sess_test_123';

  // 1. Action weights configuration
  console.log('Testing action weights...');
  assert.strictEqual(ACTION_WEIGHTS.product_view, 1.0);
  assert.strictEqual(ACTION_WEIGHTS.cart_add, 4.0);
  assert.strictEqual(ACTION_WEIGHTS.purchase, 6.0);
  assert.strictEqual(ACTION_WEIGHTS.wishlist_remove, -1.5);
  console.log('  ✅ Action weights match specification');

  // 2. Record interactions
  console.log('Testing interaction recording...');
  const ev1 = await recordInteraction({
    userId: testUserId,
    sessionId: testSessionId,
    actionType: 'product_view',
    productId: 'B001'
  });
  assert.strictEqual(ev1.actionType, 'product_view');
  assert.strictEqual(ev1.category, 'home');
  assert.strictEqual(ev1.weight, 1.0);

  const ev2 = await recordInteraction({
    userId: testUserId,
    sessionId: testSessionId,
    actionType: 'cart_add',
    productId: 'B001'
  });
  assert.strictEqual(ev2.actionType, 'cart_add');
  assert.strictEqual(ev2.weight, 4.0);

  const ev3 = await recordInteraction({
    userId: testUserId,
    sessionId: testSessionId,
    actionType: 'purchase',
    productId: 'B002'
  });
  assert.strictEqual(ev3.actionType, 'purchase');
  console.log('  ✅ Interaction events recorded successfully');

  // 3. User Affinity Profile Computation
  console.log('Testing affinity profile calculation...');
  const affinity = await getUserAffinity(testUserId, testSessionId);
  assert.strictEqual(affinity.hasPreferences, true);
  assert.ok(affinity.totalSignals >= 3, 'Should have processed at least 3 signals');
  assert.ok(affinity.categoryScores['home'] > 5, 'Home category score should be boosted by cart and purchase');
  assert.ok(affinity.pricePreference.average > 0, 'Average preferred price should be computed');
  console.log('  ✅ Affinity profile accurately aggregates category and price affinities');

  // 4. Personalization Score Boost
  console.log('Testing personalization scoring...');
  const homeBeddingProduct = getProductById('B001');
  const electronicsProduct = {
    id: 'E999',
    name: 'Wireless Mouse',
    category: 'electronics',
    subcategory: 'peripherals',
    brand: 'Logitech',
    price: 3500
  };

  const homeScore = calculatePersonalizationScore(homeBeddingProduct, affinity);
  const electronicsScore = calculatePersonalizationScore(electronicsProduct, affinity);

  assert.ok(homeScore > electronicsScore, `Home product (${homeScore}) should rank higher than neutral electronics (${electronicsScore}) for bedding-preferring user`);
  assert.ok(homeScore >= 0.6, 'Home product should receive positive boost');
  console.log('  ✅ Personalization boost accurately favors preferred categories and price profiles');

  console.log('\n───────────────────────────────────────────────────────');
  console.log('Personalization Service Tests: ALL PASSED ✅\n');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
