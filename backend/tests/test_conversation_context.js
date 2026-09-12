import { getContext, updateContext, clearContext } from '../src/utils/conversationContext.js';
import assert from 'assert';

async function runTests() {
  console.log("Running conversation context tests...");

  // 1. Create context
  const id1 = "conv_1";
  updateContext(id1, { lastIntent: "shopping", lastProducts: [{ id: "E001" }, { id: "E002" }] });
  
  // 2. Retrieve context
  let ctx = getContext(id1);
  assert.strictEqual(ctx.lastIntent, "shopping");
  assert.strictEqual(ctx.lastProducts.length, 2);

  // 3. Update context
  updateContext(id1, { lastResponse: "Here are products." });
  
  // 4. Retrieve updated context
  ctx = getContext(id1);
  assert.strictEqual(ctx.lastIntent, "shopping");
  assert.strictEqual(ctx.lastResponse, "Here are products.");

  // 5. Clear context
  clearContext(id1);
  assert.strictEqual(getContext(id1), null);

  // 6. Maximum context limit
  for (let i = 0; i < 1005; i++) {
    updateContext(`conv_bulk_${i}`, { lastIntent: "test" });
  }
  
  // The first 5 should be evicted if max is 1000
  assert.strictEqual(getContext('conv_bulk_0'), null);
  assert.notStrictEqual(getContext('conv_bulk_1004'), null);

  // 7. Missing conversationId does not crash
  updateContext(null, { test: 1 });
  assert.strictEqual(getContext(null), null);

  console.log("All tests passed! ✅");
}

runTests().catch(console.error);
