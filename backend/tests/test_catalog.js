import assert from 'assert';
import CATALOG, {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsByCategoryAndBudget,
  getProductsByIds
} from '../src/utils/catalog.js';

console.log("Starting tests...");

// Test 1: getAllProducts()
assert.ok(getAllProducts().length >= 68, "Test 1 Failed: Length should be at least 68");
console.log("Test 1 passed");

// Test 2: getProductById(validId)
const p1 = getProductById("B001");
const expectedP1 = CATALOG.find(p => p.id === "B001");
assert.deepStrictEqual(p1, expectedP1, "Test 2 Failed");
console.log("Test 2 passed");

// Test 3: getProductById(invalidId)
const pInv = getProductById("INVALID");
assert.strictEqual(pInv, null, "Test 3 Failed");
console.log("Test 3 passed");

// Test 4: getProductsByCategory("kitchen")
const kit = getProductsByCategory("kitchen");
const expectedKit = CATALOG.filter(p => (p.subcategory || '').toLowerCase() === "kitchen" || (p.category || '').toLowerCase() === "kitchen");
assert.deepStrictEqual(kit, expectedKit, "Test 4 Failed");
console.log("Test 4 passed");

// Test 5: getProductsByCategoryAndBudget("kitchen", 1000)
const kitB = getProductsByCategoryAndBudget("kitchen", 1000);
const expectedKitB = expectedKit.filter(p => p.price <= 1000);
assert.deepStrictEqual(kitB, expectedKitB, "Test 5 Failed");
console.log("Test 5 passed");

// Test 6: getProductsByIds([...])
const ids = ["B001", "K002", "INVALID"];
const expectedIds = [CATALOG.find(p => p.id === "B001"), CATALOG.find(p => p.id === "K002")];
assert.deepStrictEqual(getProductsByIds(ids), expectedIds, "Test 6 Failed");
console.log("Test 6 passed");

console.log("All tests passed!");
