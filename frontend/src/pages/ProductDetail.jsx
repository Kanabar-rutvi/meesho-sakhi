import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Star,
  RotateCcw,
  Sparkles,
  Check,
  PackageCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getApiUrl } from '../constants';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchProductAndSimilar = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiUrl()}/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Product not found in marketplace catalog.");
          throw new Error("Failed to load product details.");
        }
        const data = await res.json();
        setProduct(data);
        setActiveImageIndex(0);

        // Auto-select first variant if attributes define sizes/colors
        if (data.attributes?.size) {
          setSelectedSize(data.attributes.size);
        } else if (data.category?.toLowerCase() === 'fashion') {
          setSelectedSize('M');
        }

        if (data.attributes?.color) {
          setSelectedColor(data.attributes.color);
        }

        // Check if item is in guest wishlist
        try {
          const guestWish = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');
          setWishlisted(guestWish.some(item => item.id === data.id));
        } catch (_) {}

        // Fetch similar products
        try {
          const simRes = await fetch(`${getApiUrl()}/products/${id}/similar`);
          if (simRes.ok) {
            const simData = await simRes.json();
            setSimilarProducts(simData.similar || []);
          }
        } catch (_) {}
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndSimilar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAction = (action) => {
    if (action === 'wishlist') {
      const nextState = !wishlisted;
      setWishlisted(nextState);
      try {
        const currentWishlist = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');
        let updated;
        if (nextState) {
          if (!currentWishlist.some(item => item.id === product.id)) {
            updated = [...currentWishlist, product];
          } else {
            updated = currentWishlist;
          }
        } else {
          updated = currentWishlist.filter(item => item.id !== product.id);
        }
        localStorage.setItem('guest_wishlist', JSON.stringify(updated));
      } catch (_) {}

      setToast({
        type: 'success',
        message: nextState ? 'Added to your Wishlist' : 'Removed from your Wishlist'
      });
    } else {
      setToast({
        type: 'success',
        message: `Added ${quantity} item(s) to your Cart.`
      });
    }

    setTimeout(() => setToast(null), 3500);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--bg-main, #f8fafc)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: 'var(--brand-primary, #9c27b0)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '70vh', background: 'var(--bg-main, #f8fafc)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '16px' }}>{error || "Product Not Found"}</h2>
        <button
          onClick={() => navigate('/search')}
          style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--brand-primary, #9c27b0)', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Browse Marketplace Catalog
        </button>
      </div>
    );
  }

  const galleryImages = (product.images && product.images.length > 0)
    ? product.images
    : [{ url: product.image || product.image_url, type: 'main' }];

  const currentImage = galleryImages[activeImageIndex]?.url || galleryImages[0]?.url;
  const discountPercent = product.discountPercent || (product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0);

  const availableSizes = product.attributes?.availableSizes || (
    product.category?.toLowerCase() === 'fashion' && (product.subcategory?.toLowerCase() === 'footwear')
      ? ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']
      : product.category?.toLowerCase() === 'fashion'
        ? ['S', 'M', 'L', 'XL', 'XXL']
        : null
  );

  return (
    <div style={{ background: 'var(--bg-main, #f8fafc)', minHeight: '100vh', padding: '24px 20px 80px', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary, #64748b)', marginBottom: '20px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to={`/search?category=${product.category}`} style={{ textDecoration: 'none', color: 'inherit' }}>{product.category}</Link>
          {product.subcategory && (
            <>
              <ChevronRight size={14} />
              <Link to={`/search?category=${product.category}&subcategory=${product.subcategory}`} style={{ textDecoration: 'none', color: 'inherit' }}>{product.subcategory}</Link>
            </>
          )}
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary, #64748b)', fontWeight: 600, cursor: 'pointer', marginBottom: '20px', fontSize: '14px', padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to Results
        </button>

        {/* Main Product Container: Gallery + Details */}
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '32px', marginBottom: '36px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 460px) 1fr', gap: '48px', alignItems: 'start' }}>

            {/* Left: Product Image Gallery */}
            <div>
              {/* Main Image Container */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  marginBottom: '16px'
                }}
              >
                {discountPercent > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      background: '#059669',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      zIndex: 2
                    }}
                  >
                    {discountPercent}% OFF
                  </div>
                )}
                <img
                  src={currentImage}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Thumbnails list */}
              {galleryImages.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {galleryImages.map((img, idx) => (
                    <button
                      key={img.url || idx}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '8px',
                        border: activeImageIndex === idx ? '2px solid var(--brand-primary, #9c27b0)' : '1px solid var(--border-color, #cbd5e1)',
                        padding: '4px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        opacity: activeImageIndex === idx ? 1 : 0.65,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img src={img.url} alt={`View ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Purchase Details */}
            <div>
              {/* Brand */}
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-primary, #9c27b0)', marginBottom: '8px' }}>
                {product.brand}
              </div>

              {/* Product Title */}
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', lineHeight: 1.3, marginBottom: '14px' }}>
                {product.name}
              </h1>

              {/* Rating & Reviews Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#047857', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
                  <span>{(product.rating || 4.2).toFixed(1)}</span>
                  <Star size={13} fill="currentColor" />
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                  ({(product.reviews || product.reviewCount || 0).toLocaleString()} Verified Customer Reviews)
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>Verified Authentic</span>
              </div>

              {/* Price Block */}
              <div style={{ background: 'var(--bg-subtle, #f8fafc)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span style={{ fontSize: '18px', color: 'var(--text-tertiary, #94a3b8)', textDecoration: 'line-through' }}>
                      MRP ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
                  Inclusive of all applicable marketplace taxes. Free shipping applied.
                </div>
              </div>

              {/* Variant Selector: Sizes if applicable */}
              {availableSizes && (
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '10px' }}>
                    Select Size:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: selectedSize === size ? 700 : 500,
                          border: '1.5px solid',
                          borderColor: selectedSize === size ? 'var(--brand-primary, #9c27b0)' : 'var(--border-color, #cbd5e1)',
                          background: selectedSize === size ? 'rgba(156, 39, 176, 0.08)' : '#ffffff',
                          color: selectedSize === size ? 'var(--brand-primary, #9c27b0)' : 'var(--text-primary, #334155)',
                          cursor: 'pointer'
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Actions */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    -
                  </button>
                  <span style={{ padding: '10px 12px', fontWeight: 700, fontSize: '14px' }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  onClick={() => handleAction('cart')}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    borderRadius: '8px',
                    background: 'var(--brand-primary, #9c27b0)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.25)'
                  }}
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>

                {/* Wishlist CTA */}
                <button
                  onClick={() => handleAction('wishlist')}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: '#ffffff',
                    color: wishlisted ? '#e11d48' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart size={20} fill={wishlisted ? '#e11d48' : 'none'} />
                </button>
              </div>

              {/* Toast Feedback */}
              {toast && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color="#059669" />
                  <span>{toast.message}</span>
                </div>
              )}

              {/* Trust Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', borderTop: '1px solid var(--border-color, #f1f5f9)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary, #475569)' }}>
                  <ShieldCheck size={20} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>100% Genuine</div>
                    <div>Direct Brand Sourced</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary, #475569)' }}>
                  <Truck size={20} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>Free Delivery</div>
                    <div>Safe Doorstep Dispatch</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary, #475569)' }}>
                  <RotateCcw size={20} color="#059669" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>7-Day Returns</div>
                    <div>Hassle-Free Exchange</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Sakhi AI Companion Recommendation Insight */}
        <div style={{ background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(156, 39, 176, 0.2)', borderRadius: '16px', padding: '24px', marginBottom: '36px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-primary, #9c27b0)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-primary, #9c27b0)', marginBottom: '4px' }}>
              Sakhi AI Shopping Advisor Note
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary, #1e293b)', lineHeight: 1.5 }}>
              This <strong>{product.name}</strong> from <strong>{product.brand}</strong> matches your preference profile with high quality ratings ({product.rating}★). The material and construction are rated highly for longevity and everyday comfort.
            </p>
          </div>
        </div>

        {/* Specifications & Attributes Table */}
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '28px', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '18px' }}>
            Product Specifications & Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', padding: '10px 14px', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '8px' }}>
              <span style={{ width: '130px', color: 'var(--text-tertiary, #64748b)', fontSize: '13px' }}>Category</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)', fontSize: '13px' }}>{product.category}</span>
            </div>
            {product.subcategory && (
              <div style={{ display: 'flex', padding: '10px 14px', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '8px' }}>
                <span style={{ width: '130px', color: 'var(--text-tertiary, #64748b)', fontSize: '13px' }}>Subcategory</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)', fontSize: '13px' }}>{product.subcategory}</span>
              </div>
            )}
            <div style={{ display: 'flex', padding: '10px 14px', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '8px' }}>
              <span style={{ width: '130px', color: 'var(--text-tertiary, #64748b)', fontSize: '13px' }}>Brand</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)', fontSize: '13px' }}>{product.brand}</span>
            </div>

            {product.attributes && Object.entries(product.attributes).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', padding: '10px 14px', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '8px' }}>
                <span style={{ width: '130px', color: 'var(--text-tertiary, #64748b)', fontSize: '13px', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)', fontSize: '13px' }}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '8px' }}>
            Description
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #475569)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            {product.description || `Original ${product.name} by ${product.brand}. Built with durable materials, certified quality testing, and backed by manufacturer warranty.`}
          </p>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color, #f1f5f9)' }}>
              {product.tags.map(tag => (
                <Link to={`/search?q=${encodeURIComponent(tag)}`} key={tag} style={{ textDecoration: 'none' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--bg-subtle, #f1f5f9)', borderRadius: '16px', fontSize: '12px', color: 'var(--text-secondary, #475569)' }}>
                    #{tag}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Similar Marketplace Products */}
        {similarProducts.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary, #0f172a)', margin: '0 0 4px 0' }}>
                  Similar Products You May Like
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                  Hand-picked alternatives in {product.category}
                </div>
              </div>
              <Link
                to={`/search?category=${encodeURIComponent(product.category)}`}
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary, #9c27b0)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View More in {product.category} <ChevronRight size={14} />
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '20px'
              }}
            >
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
