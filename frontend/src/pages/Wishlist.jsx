import React, { useState } from 'react';
import { Heart, Trash2, ShoppingBag, ExternalLink } from 'lucide-react';

// Mock wishlist data — in production this would come from the backend via API
const MOCK_WISHLIST = [
  { id: 'w1', name: 'Sleepyhead Memory Foam Pillow', price: 899, category: 'bedding', rating: 4.3, image: '🛏️', addedDate: '2 days ago' },
  { id: 'w2', name: 'Milton Thermosteel Flask 750ml', price: 649, category: 'kitchen', rating: 4.5, image: '🍳', addedDate: '3 days ago' },
  { id: 'w3', name: 'Wipro LED Desk Lamp 10W', price: 1299, category: 'electronics', rating: 4.1, image: '💡', addedDate: '1 week ago' },
  { id: 'w4', name: 'Amazon Basics Foldable Laundry Bag', price: 399, category: 'storage', rating: 4.0, image: '📦', addedDate: '1 week ago' },
];

export default function Wishlist() {
  const [items, setItems] = useState(MOCK_WISHLIST);

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Heart size={28} color="var(--brand-secondary)" fill="var(--brand-secondary)" /> Wishlist
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              {items.length} items · ₹{totalValue.toLocaleString()} total
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💜</div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Items you save from Sakhi's recommendations will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, idx) => (
              <div key={item.id} className="card animate-fade-in" style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                animationDelay: `${idx * 50}ms`, padding: '16px'
              }}>
                <div style={{
                  width: '56px', height: '56px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--purple-100), rgba(147,51,234,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', flexShrink: 0
                }}>
                  {item.image}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: 'var(--brand-primary)',
                      background: 'rgba(147,51,234,0.06)', padding: '3px 10px',
                      borderRadius: 'var(--radius-full)', textTransform: 'capitalize'
                    }}>{item.category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      ★ {item.rating} · Added {item.addedDate}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--brand-primary)' }}>
                    ₹{item.price.toLocaleString()}
                  </div>
                </div>

                <button onClick={() => removeItem(item.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: '8px',
                  borderRadius: 'var(--radius-full)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none'; }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
