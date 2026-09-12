import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Filter, ChevronRight, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getApiUrl } from '../constants';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  'All Categories',
  'Fashion',
  'Electronics',
  'Home & Living',
  'Beauty',
  'Accessories'
];

const PRICE_RANGES = [
  { label: 'All Prices', min: null, max: null },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 & Above', min: 2500, max: null }
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All Categories');
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if URL params change
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('All Categories');
    }
    if (subcategoryParam) {
      setSelectedSubcategory(subcategoryParam);
    }
  }, [categoryParam, subcategoryParam]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${getApiUrl()}/products`;
        const params = new URLSearchParams();

        if (query.trim()) {
          url += `/search`;
          params.append('q', query.trim());
        }

        if (selectedCategory && selectedCategory !== 'All Categories') {
          params.append('category', selectedCategory);
        }

        if (selectedSubcategory) {
          params.append('subcategory', selectedSubcategory);
        }

        if (selectedBrand && selectedBrand !== 'All') {
          params.append('brand', selectedBrand);
        }

        const priceRange = PRICE_RANGES[selectedPriceRange];
        if (priceRange.min !== null) params.append('min_price', priceRange.min);
        if (priceRange.max !== null) params.append('max_price', priceRange.max);

        if (minRating > 0) params.append('min_rating', minRating);
        if (sortBy) params.append('sort_by', sortBy);
        if (inStockOnly) params.append('in_stock', 'true');

        params.append('limit', '60');

        const fullUrl = `${url}?${params.toString()}`;
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        
        // Strict deduplication safeguard by product ID and image URL
        const seenIds = new Set();
        const seenImages = new Set();
        const deduplicated = [];

        for (const p of (data.products || [])) {
          const img = p.image || p.image_url || (p.images && p.images[0]?.url);
          if (seenIds.has(p.id)) continue;
          if (img && seenImages.has(img)) continue;
          seenIds.add(p.id);
          if (img) seenImages.add(img);
          deduplicated.push(p);
        }

        setProducts(deduplicated);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, selectedCategory, selectedSubcategory, selectedPriceRange, minRating, selectedBrand, sortBy, inStockOnly]);

  // Available brands derived dynamically from current candidate products
  const availableBrands = useMemo(() => {
    const brands = new Set();
    products.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return ['All', ...Array.from(brands).sort()];
  }, [products]);

  // Available subcategories derived dynamically
  const availableSubcategories = useMemo(() => {
    const subs = new Set();
    products.forEach(p => {
      if (p.subcategory) subs.add(p.subcategory);
    });
    return Array.from(subs).sort();
  }, [products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const q = formData.get('q');
    setSearchParams(q ? { q } : {});
  };

  const handleResetFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedSubcategory('');
    setSelectedPriceRange(0);
    setMinRating(0);
    setSelectedBrand('All');
    setSortBy('relevance');
    setInStockOnly(false);
    setSearchParams({});
  };

  return (
    <div style={{ background: 'var(--bg-main, #f8fafc)', minHeight: '100vh', padding: '24px 20px 60px', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        {/* 1. Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary, #64748b)', marginBottom: '16px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/search" style={{ textDecoration: 'none', color: 'inherit' }}>Marketplace</Link>
          {selectedCategory !== 'All Categories' && (
            <>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--brand-primary, #9c27b0)', fontWeight: 600 }}>{selectedCategory}</span>
            </>
          )}
          {selectedSubcategory && (
            <>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: 600 }}>{selectedSubcategory}</span>
            </>
          )}
        </nav>

        {/* 2. Search & Header Banner */}
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                {query ? `Search results for "${query}"` : (selectedCategory !== 'All Categories' ? selectedCategory : 'Browse Catalog')}
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                Showing <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{products.length}</strong> verified authentic marketplace products
              </div>
            </div>

            {/* Live Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '460px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <SearchIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search footwear, electronics, bedding, fashion..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-subtle, #f8fafc)',
                    fontSize: '14px',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: 'var(--brand-primary, #9c27b0)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 20px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* 3. Main Marketplace Layout: Sidebar Filters + Products Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* Left Filter Sidebar */}
          <aside style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '20px', position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary, #0f172a)' }}>
                <SlidersHorizontal size={16} color="var(--brand-primary, #9c27b0)" />
                Filters
              </div>
              <button
                onClick={handleResetFilters}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary, #94a3b8)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                title="Reset all filters"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', marginBottom: '10px' }}>
                Category
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedSubcategory('');
                      if (cat === 'All Categories') {
                        searchParams.delete('category');
                        setSearchParams(searchParams);
                      } else {
                        setSearchParams({ category: cat });
                      }
                    }}
                    style={{
                      textAlign: 'left',
                      background: selectedCategory === cat ? 'rgba(156, 39, 176, 0.08)' : 'transparent',
                      color: selectedCategory === cat ? 'var(--brand-primary, #9c27b0)' : 'var(--text-primary, #334155)',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory Filter (when category is selected) */}
            {availableSubcategories.length > 0 && selectedCategory !== 'All Categories' && (
              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', marginBottom: '10px' }}>
                  Subcategory
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    onClick={() => setSelectedSubcategory('')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: selectedSubcategory === '' ? 700 : 500,
                      border: '1px solid',
                      borderColor: selectedSubcategory === '' ? 'var(--brand-primary, #9c27b0)' : 'var(--border-color, #cbd5e1)',
                      background: selectedSubcategory === '' ? 'var(--brand-primary, #9c27b0)' : 'var(--bg-subtle, #f8fafc)',
                      color: selectedSubcategory === '' ? '#ffffff' : 'var(--text-secondary, #475569)',
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </button>
                  {availableSubcategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? '' : sub)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: selectedSubcategory === sub ? 700 : 500,
                        border: '1px solid',
                        borderColor: selectedSubcategory === sub ? 'var(--brand-primary, #9c27b0)' : 'var(--border-color, #cbd5e1)',
                        background: selectedSubcategory === sub ? 'var(--brand-primary, #9c27b0)' : 'var(--bg-subtle, #f8fafc)',
                        color: selectedSubcategory === sub ? '#ffffff' : 'var(--text-secondary, #475569)',
                        cursor: 'pointer'
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Filter */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', marginBottom: '10px' }}>
                Price Range
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PRICE_RANGES.map((pr, idx) => (
                  <label key={pr.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary, #334155)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === idx}
                      onChange={() => setSelectedPriceRange(idx)}
                      style={{ accentColor: 'var(--brand-primary, #9c27b0)' }}
                    />
                    <span>{pr.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {availableBrands.length > 2 && (
              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', marginBottom: '10px' }}>
                  Brand
                </div>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-subtle, #f8fafc)',
                    fontSize: '13px',
                    color: 'var(--text-primary, #0f172a)'
                  }}
                >
                  {availableBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Rating Filter */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748b)', marginBottom: '10px' }}>
                Customer Rating
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'All Ratings', val: 0 },
                  { label: '4.5★ & Above', val: 4.5 },
                  { label: '4.0★ & Above', val: 4.0 },
                  { label: '3.5★ & Above', val: 3.5 }
                ].map(r => (
                  <label key={r.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary, #334155)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="minRating"
                      checked={minRating === r.val}
                      onChange={() => setMinRating(r.val)}
                      style={{ accentColor: 'var(--brand-primary, #9c27b0)' }}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* In-Stock Toggle */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-color, #f1f5f9)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  style={{ accentColor: 'var(--brand-primary, #9c27b0)' }}
                />
                <span>In-Stock Items Only</span>
              </label>
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <main>
            {/* Top Toolbar: Sorting and count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '10px', padding: '10px 16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                Showing <strong>{products.length}</strong> items
              </div>

              {/* Sort By Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', fontWeight: 500 }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-card, #ffffff)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary, #0f172a)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="popularity">Popularity</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 0' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: 'var(--brand-primary, #9c27b0)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : error ? (
              <div style={{ padding: '32px', background: 'var(--bg-card, #ffffff)', border: '1px solid #fee2e2', borderRadius: '12px', textAlign: 'center', color: '#b91c1c' }}>
                Failed to load products: {error}
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: '80px 24px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '8px' }}>
                  No products found matching your filters
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', marginBottom: '24px' }}>
                  Try relaxing price constraints, choosing a different category, or clearing filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  style={{
                    background: 'var(--brand-primary, #9c27b0)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '20px'
                }}
              >
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
