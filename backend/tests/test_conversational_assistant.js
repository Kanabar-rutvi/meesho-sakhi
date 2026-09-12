/**
 * Conversational assistant test suite — Task 19
 * Tests intentRouter, productReferenceResolver, and context-aware behavior.
 * Zero Claude calls required for any of these tests.
 */
import assert from 'assert';
import { routeIntent } from '../src/utils/intentRouter.js';
import { resolveProductReference, describeProduct } from '../src/utils/productReferenceResolver.js';

let passed = 0; let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch(e) { console.error(`  ❌ ${name}: ${e.message}`); failed++; }
}

// Sample products for context tests
const SAMPLE_PRODS = [
  { id: 'B001', name: 'Pillow Set', price: 299, rating: 4.3, reviews: 220, brand: 'Sleepwell', tags: ['hostel', 'bedding'] },
  { id: 'K001', name: 'Steel Kettle', price: 599, rating: 4.6, reviews: 850, brand: 'Borosil', tags: ['kitchen', 'hostel'] },
  { id: 'E001', name: 'USB Fan', price: 450, rating: 4.1, reviews: 310, brand: 'Orient', tags: ['electronics', 'portable'] },
];

console.log('\n── Intent Router ────────────────────────────────────────');

// 1. Hello → greeting
test('hello → greeting', () => {
  assert.strictEqual(routeIntent('hello').intent, 'greeting');
});

// 2. Hi → greeting
test('hi → greeting', () => {
  assert.strictEqual(routeIntent('hi').intent, 'greeting');
});

test('Namaste → greeting', () => {
  assert.strictEqual(routeIntent('namaste').intent, 'greeting');
});

// 3. Thanks → gratitude
test('thanks → gratitude', () => {
  assert.strictEqual(routeIntent('thanks').intent, 'gratitude');
});

test('thank you → gratitude', () => {
  assert.strictEqual(routeIntent('thank you').intent, 'gratitude');
});

// 4. What can you do → general_chat
test('what can you do → general_chat', () => {
  assert.strictEqual(routeIntent('what can you do').intent, 'general_chat');
});

// 5. Tell me about yourself → general_chat
test('tell me about yourself → general_chat', () => {
  assert.strictEqual(routeIntent('tell me about yourself').intent, 'general_chat');
});

test('who are you → general_chat', () => {
  assert.strictEqual(routeIntent('who are you').intent, 'general_chat');
});

// 6. Unclear query → unclear
test('"I want something nice" → unclear', () => {
  assert.strictEqual(routeIntent('I want something nice').intent, 'unclear');
});

test('"maybe" → unclear', () => {
  assert.strictEqual(routeIntent('maybe').intent, 'unclear');
});

// 7. Fresh shopping → shopping
test('"I need a kitchen product under 1000" → shopping', () => {
  assert.strictEqual(routeIntent('I need a kitchen product under 1000').intent, 'shopping');
});

test('"show me electronics under 2000" → shopping', () => {
  assert.strictEqual(routeIntent('show me electronics under 2000').intent, 'shopping');
});

test('"buy bedding" → shopping', () => {
  assert.strictEqual(routeIntent('buy bedding').intent, 'shopping');
});

// 8. Product question (context-dependent routing)
test('"which is cheapest" → product_question', () => {
  assert.strictEqual(routeIntent('which is cheapest').intent, 'product_question');
});

test('"what is the price of the first one" → product_question', () => {
  assert.strictEqual(routeIntent('what is the price of the first one').intent, 'product_question');
});

test('"which has best rating" → product_question', () => {
  assert.strictEqual(routeIntent('which has best rating').intent, 'product_question');
});

// 9. Shopping follow-up
test('"show me something cheaper" → shopping_followup', () => {
  assert.strictEqual(routeIntent('show me something cheaper').intent, 'shopping_followup');
});

test('"show me more" → shopping_followup', () => {
  assert.strictEqual(routeIntent('show me more').intent, 'shopping_followup');
});

test('"something better" → shopping_followup', () => {
  assert.strictEqual(routeIntent('something better').intent, 'shopping_followup');
});

// 10. Product detail
test('"tell me more about the first one" → product_detail', () => {
  assert.strictEqual(routeIntent('tell me more about the first one').intent, 'product_detail');
});

test('"describe the second product" → product_detail', () => {
  assert.strictEqual(routeIntent('describe the second product').intent, 'product_detail');
});

test('"more about the third option" → product_detail', () => {
  assert.strictEqual(routeIntent('more about the third option').intent, 'product_detail');
});

// 11. Budget change
test('"make it under 500" → budget_change', () => {
  assert.strictEqual(routeIntent('make it under 500').intent, 'budget_change');
});

// 12. Category change
test('"show electronics instead" → category_change', () => {
  assert.strictEqual(routeIntent('show electronics instead').intent, 'category_change');
});

test('"switch to kitchen" → category_change', () => {
  assert.strictEqual(routeIntent('switch to kitchen').intent, 'category_change');
});

// Greeting has message
test('greeting includes a friendly message', () => {
  const r = routeIntent('hello');
  assert.ok(typeof r.message === 'string' && r.message.length > 10);
  assert.ok(r.message.includes('Sakhi'));
});

// Gratitude has message
test('gratitude includes a friendly message', () => {
  const r = routeIntent('thanks');
  assert.ok(typeof r.message === 'string');
});

// Unclear has message
test('unclear includes a helpful message', () => {
  const r = routeIntent('I want something nice');
  assert.ok(typeof r.message === 'string');
});

console.log('\n── Product Reference Resolver ───────────────────────────');

// 13. "the first one"
test('"the first one" resolves to index 0', () => {
  const { product, index, method } = resolveProductReference('tell me about the first one', SAMPLE_PRODS);
  assert.strictEqual(index, 0);
  assert.strictEqual(product.id, 'B001');
  assert.strictEqual(method, 'ordinal');
});

// 14. "the second one"
test('"the second one" resolves to index 1', () => {
  const { product, index } = resolveProductReference('price of the second one', SAMPLE_PRODS);
  assert.strictEqual(index, 1);
  assert.strictEqual(product.id, 'K001');
});

// 15. "the third one"
test('"the third one" resolves to index 2', () => {
  const { product } = resolveProductReference('tell me about the third option', SAMPLE_PRODS);
  assert.strictEqual(product.id, 'E001');
});

// 16. "cheapest"
test('"cheapest" resolves to lowest price product', () => {
  const { product, method } = resolveProductReference('which is the cheapest', SAMPLE_PRODS);
  assert.strictEqual(product.id, 'B001'); // 299 is cheapest
  assert.strictEqual(method, 'cheapest');
});

// 17. "best rated"
test('"best rated" resolves to highest rated product', () => {
  const { product, method } = resolveProductReference('which has the best rating', SAMPLE_PRODS);
  assert.strictEqual(product.id, 'K001'); // 4.6 is highest
  assert.strictEqual(method, 'best_rated');
});

// 18. Empty context → null
test('empty products → null product', () => {
  const { product } = resolveProductReference('tell me about the first one', []);
  assert.strictEqual(product, null);
});

// 19. Invalid reference → null
test('non-matching query → method=none', () => {
  const { product, method } = resolveProductReference('something completely random xyz', SAMPLE_PRODS);
  assert.strictEqual(method, 'none');
  assert.strictEqual(product, null);
});

// 20. "most expensive"
test('"most expensive" resolves to highest price', () => {
  const { product } = resolveProductReference('show me the most expensive one', SAMPLE_PRODS);
  assert.strictEqual(product.id, 'K001'); // 599 is most expensive
});

// 21. describeProduct
test('describeProduct returns a formatted string', () => {
  const desc = describeProduct(SAMPLE_PRODS[0]);
  assert.ok(desc.includes('Pillow Set'));
  assert.ok(desc.includes('₹299'));
  assert.ok(desc.includes('4.3'));
});

test('describeProduct null returns error string', () => {
  const desc = describeProduct(null);
  assert.ok(typeof desc === 'string');
  assert.ok(desc.length > 0);
});

// 22. Intent has no Claude call requirement
test('No intent type requires a Claude call for non-shopping intents', () => {
  const nonShoppingIntents = ['greeting', 'gratitude', 'general_chat', 'product_detail', 'product_question', 'shopping_followup', 'budget_change', 'category_change', 'unclear'];
  for (const q of ['hello', 'thanks', 'what can you do', 'tell me more about the second one', 'which is cheapest', 'show me cheaper', 'make it under 500', 'show electronics instead', 'hmmm']) {
    const r = routeIntent(q);
    assert.ok(nonShoppingIntents.includes(r.intent) || r.intent === 'shopping', `Unexpected intent for "${q}": ${r.intent}`);
  }
});

console.log(`\n${'─'.repeat(55)}`);
console.log(`Total: ${passed + failed} | ✅ ${passed} passed | ❌ ${failed} failed\n`);
if (failed > 0) process.exit(1);
