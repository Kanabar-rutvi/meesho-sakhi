import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Truck, ShoppingBag, Eye } from 'lucide-react';

export default function ProductCard({ product, onWishlistToggle, isWishlisted = false }) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const primaryImage = product.image || product.image_url || (product.images && product.images[0]?.url) || '';
  const discount = product.discountPercent || (product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0);
  const rating = product.rating || 4.2;
  const reviews = product.reviews || product.reviewCount || 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !wishlisted;
    setWishlisted(nextState);

    try {
      const stored = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');
      let updated;
      if (nextState) {
        if (!stored.some(p => p.id === product.id)) {
          updated = [...stored, product];
        } else {
          updated = stored;
        }
      } else {
        updated = stored.filter(p => p.id !== product.id);
      }
      localStorage.setItem('guest_wishlist', JSON.stringify(updated));
    } catch (_) {}

    if (onWishlistToggle) {
      onWishlistToggle(product, nextState);
    }
  };

  return (
    <div
      className="marketplace-product-card"
      style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e5e7eb)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease',
        cursor: 'pointer',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = 'var(--brand-primary, #9c27b0)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
      }}
    >
      <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Aspect-Ratio 1:1 Image Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            background: 'var(--bg-subtle, #f9fafb)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Discount Pill Badge */}
          {discount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: '#059669',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                zIndex: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}
            >
              {discount}% OFF
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              transition: 'transform 0.15s ease, background-color 0.15s ease',
              color: wishlisted ? '#e11d48' : '#64748b'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.92)';
            }}
          >
            <Heart size={18} fill={wishlisted ? '#e11d48' : 'none'} strokeWidth={2} />
          </button>

          {/* Product Image */}
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '12px',
              transition: 'transform 0.35s ease',
              opacity: imgLoaded ? 1 : 0.8
            }}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgError(true);
              e.currentTarget.style.display = 'none';
            }}
          />

          {imgError && (
            <div style={{ color: 'var(--text-tertiary, #94a3b8)', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <ShoppingBag size={28} />
              <span>Image Preview</span>
            </div>
          )}
        </div>

        {/* Product Card Body */}
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Brand */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--brand-primary, #9c27b0)',
              marginBottom: '4px'
            }}
          >
            {product.brand || 'Verified Brand'}
          </div>

          {/* Product Title (2 lines clamp) */}
          <h3
            title={product.name}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '1.35',
              color: 'var(--text-primary, #111827)',
              margin: '0 0 8px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '38px'
            }}
          >
            {product.name}
          </h3>

          {/* Rating and Review Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: '#047857',
                color: '#ffffff',
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <span>{rating.toFixed(1)}</span>
              <Star size={11} fill="currentColor" />
            </div>
            {reviews > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary, #6b7280)' }}>
                ({reviews.toLocaleString()})
              </span>
            )}
          </div>

          {/* Pricing Block */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary, #111827)' }}>
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span style={{ fontSize: '13px', color: 'var(--text-tertiary, #9ca3af)', textDecoration: 'line-through' }}>
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Delivery & Trust Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-secondary, #4b5563)',
              marginTop: 'auto',
              paddingTop: '8px',
              borderTop: '1px dashed var(--border-color, #f3f4f6)'
            }}
          >
            <Truck size={13} color="#059669" />
            <span style={{ fontWeight: 500 }}>Free Delivery</span>
            <span style={{ color: '#d1d5db' }}>•</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>In Stock</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
