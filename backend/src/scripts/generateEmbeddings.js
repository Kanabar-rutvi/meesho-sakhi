import { getAllProducts } from '../utils/catalog.js';
import { embeddingService } from '../services/search/embeddingService.js';

async function run() {
  console.log('\n======================================================');
  console.log('       Meesho Sakhi — Vector Embedding Generator      ');
  console.log('======================================================\n');

  const allProducts = getAllProducts();
  console.log(`Generating text & visual embeddings for ${allProducts.length} products...`);

  const startTime = Date.now();
  const count = await embeddingService.indexCatalog(allProducts, true);
  const duration = Date.now() - startTime;

  console.log(`Successfully indexed ${count} products in ${duration}ms.`);
  console.log('Embedding cache saved to catalog-embeddings.json.\n');
}

run().catch(err => {
  console.error('Fatal embedding error:', err);
  process.exit(1);
});
