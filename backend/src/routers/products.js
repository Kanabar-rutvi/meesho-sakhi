import express from 'express';
import CATALOG from '../utils/catalog.js';

const router = express.Router();

// Utility to paginate and return results
const paginate = (items, page = 1, limit = 20) => {
  const p = parseInt(page, 10) || 1;
  const l = parseInt(limit, 10) || 20;
  const startIndex = (p - 1) * l;
  return items.slice(startIndex, startIndex + l);
};

// GET /products - Return all products, with optional filtering and sorting
router.get('/', (req, res) => {
  try {
    const { category, subcategory, brand, min_price, max_price, min_rating, sort_by, in_stock, limit, page } = req.query;
    let products = [...CATALOG];

    if (category) {
      const targetCat = category.toLowerCase();
      products = products.filter(p => (p.category || '').toLowerCase() === targetCat || (p.originalCategory || '').toLowerCase() === targetCat);
    }

    if (subcategory) {
      const targetSub = subcategory.toLowerCase();
      products = products.filter(p => (p.subcategory || '').toLowerCase() === targetSub || (p.originalSubcategory || '').toLowerCase() === targetSub);
    }

    if (brand) {
      const targetBrand = brand.toLowerCase();
      products = products.filter(p => (p.brand || '').toLowerCase() === targetBrand);
    }

    if (min_price) {
      const minP = parseFloat(min_price);
      if (!isNaN(minP)) products = products.filter(p => p.price >= minP);
    }

    if (max_price) {
      const maxP = parseFloat(max_price);
      if (!isNaN(maxP)) products = products.filter(p => p.price <= maxP);
    }

    if (min_rating) {
      const minR = parseFloat(min_rating);
      if (!isNaN(minR)) products = products.filter(p => (p.rating || 0) >= minR);
    }

    if (in_stock === 'true') {
      products = products.filter(p => p.in_stock !== false);
    }

    // Sorting
    if (sort_by === 'price_low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort_by === 'price_high') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort_by === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort_by === 'popularity') {
      products.sort((a, b) => (b.reviews || b.reviewCount || 0) - (a.reviews || a.reviewCount || 0));
    }

    const paginated = paginate(products, page, limit || 24);

    res.json({
      total: products.length,
      products: paginated
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

import { hybridSearchService } from '../services/search/hybridSearchService.js';

// GET /products/search - Hybrid Search for products
router.get('/search', async (req, res) => {
  try {
    const { q, category, subcategory, brand, min_price, max_price, budget, min_rating, sort_by, limit, page } = req.query;
    
    if (!q || !q.trim()) {
      // Fallback to general filtered products if no query string
      let products = [...CATALOG];
      if (category) {
        products = products.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
      }
      const paginated = paginate(products, page, limit || 24);
      return res.json({ total: products.length, products: paginated });
    }

    const searchLimit = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    const result = await hybridSearchService.search({
      query: q,
      category,
      subcategory,
      brand,
      minPrice: min_price ? parseFloat(min_price) : undefined,
      maxPrice: (max_price || budget) ? parseFloat(max_price || budget) : undefined,
      minRating: min_rating ? parseFloat(min_rating) : undefined,
      sortBy: sort_by || 'relevance',
      limit: searchLimit
    });

    const paginated = paginate(result.products, page, limit || 24);

    res.json({
      total: result.total,
      products: paginated,
      metadata: result.queryMetadata,
      ranked_items: result.rankedItems
    });
  } catch (err) {
    console.error('[products/search] error:', err);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /products/:id/similar - Similar and recommended products
router.get('/:id/similar', (req, res) => {
  try {
    const product = CATALOG.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const prodCat = (product.category || '').toLowerCase();
    const prodSub = (product.subcategory || '').toLowerCase();
    const prodTags = (product.tags || []).map(t => String(t).toLowerCase());

    const similar = CATALOG.filter(p => {
      if (p.id === product.id) return false;
      if (p.in_stock === false) return false;
      const c = (p.category || '').toLowerCase();
      const s = (p.subcategory || '').toLowerCase();
      return (s && s === prodSub) || (c && c === prodCat);
    }).map(p => {
      let score = 0;
      const s = (p.subcategory || '').toLowerCase();
      if (s && s === prodSub) score += 4;
      const pTags = (p.tags || []).map(t => String(t).toLowerCase());
      const overlap = prodTags.filter(t => pTags.includes(t)).length;
      score += overlap * 2;
      return { product: p, score };
    }).sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.product);

    res.json({
      productId: product.id,
      similar
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch similar products" });
  }
});

// GET /products/:id - Single product details
router.get('/:id', (req, res) => {
  try {
    const product = CATALOG.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
