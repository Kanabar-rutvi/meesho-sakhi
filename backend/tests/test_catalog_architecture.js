import { 
  getAllProducts, 
  getProductById, 
  getProductsByCategory, 
  getProductsByCategoryAndBudget, 
  searchProducts 
} from '../src/utils/catalog.js';
import { resolveCategory } from '../src/utils/categoryTaxonomy.js';
import assert from 'assert';

async function runTests() {
  console.log("Running catalog architecture tests...");

  // 1 & 4. Category and Alias Resolution
  assert.deepStrictEqual(resolveCategory("kurtis"), null); // kurtis not in taxonomy
  assert.deepStrictEqual(resolveCategory("bedsheet"), { category: "home", subcategory: "bedding" });
  assert.deepStrictEqual(resolveCategory("earphones"), { category: "electronics", subcategory: "audio" });
  assert.deepStrictEqual(resolveCategory("hygiene"), { category: "personal_care", subcategory: "hygiene" });

  // 2. Existing category lookup (Backward Compatibility)
  const beddingProducts = getProductsByCategory("bedding");
  assert.ok(beddingProducts.length > 0, "Should find bedding products");

  // 13. Existing 68 products remain accessible
  const allProds = getAllProducts();
  assert.ok(allProds.length >= 68, "Should have at least 68 products");
  
  // Backward compatibility: B001 was bedding
  const b001 = getProductById("B001");
  assert.strictEqual(b001.originalCategory, "bedding");
  assert.strictEqual(b001.category, "home");
  assert.strictEqual(b001.subcategory, "bedding");

  // 5 & 14. Existing budget filtering still works
  const cheapBedding = getProductsByCategoryAndBudget("bedding", 500);
  assert.ok(cheapBedding.length > 0);
  assert.ok(cheapBedding.every(p => p.price <= 500));

  // 6 & 8. Brand and rating search
  const philipsProducts = searchProducts({ brand: "Philips", rating: 4.5 });
  assert.ok(philipsProducts.length >= 1, "Should find at least 1 highly rated Philips product");
  
  // 7. Tag filtering
  const hostelItems = searchProducts({ tags: ["hostel"] });
  assert.ok(hostelItems.length > 0, "Should find hostel tagged items");

  // 10. Combined filters
  const searchResult = searchProducts({
    category: "home",
    subcategory: "kitchen",
    maxPrice: 500,
    rating: 4.0
  });
  assert.ok(searchResult.length > 0, "Should find cheap kitchen items");
  assert.ok(searchResult.every(p => p.category === "home" && p.subcategory === "kitchen" && p.price <= 500 && p.rating >= 4.0));

  console.log("All tests passed! ✅");
}

runTests().catch(console.error);
