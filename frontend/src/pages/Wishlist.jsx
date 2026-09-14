import React, { useState, useEffect } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Instead of navigating away, we handle guest state in the UI
    if (user === null) {
      setLoading(false);
      return;
    }
    
    if (user) {
      const fetchWishlist = async () => {
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
          const baseUrl = envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
          const res = await fetch(`${baseUrl}/user/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setItems(data);
          }
        } catch (error) {
          console.error("Failed to fetch wishlist", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchWishlist();
    }
  }, [user, navigate]);

  const removeItem = async (id) => {
    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== id));
    
    // In a full implementation, you would also delete this item via API call to backend
    /*
    const token = localStorage.getItem('token');
    const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
    const baseUrl = envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
    await fetch(`${baseUrl}/user/wishlist/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    */
  };

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading wishlist...</div>;

  if (!user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px', textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Heart size={32} color="var(--brand-primary)" />
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Wishlist
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Things worth coming back to.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '480px', lineHeight: 1.6 }}>
          Save products you're considering and find them again when you're ready. Sign in to sync your saved items across devices.
        </p>
        <button onClick={() => navigate('/auth')} className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)', fontSize: '14px' }}>
          Sign In to Access Saved Items
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) clamp(14px, 3.5vw, 24px)' }}>
      
      {/* ─── Page Header (Intro before function) ─── */}
      <div className="animate-fade-in" style={{
        marginBottom: '32px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '24px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Wishlist
        </div>
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Things worth coming back to.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Save products you're considering and find them again when you're ready.
        </p>
      </div>

      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {items.length} items · ₹{totalValue.toLocaleString()} total
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
              <Heart size={28} color="var(--text-tertiary)" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Your wishlist is waiting for its first find.</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Items you save from your personalized recommendations will appear here.</p>
            <button onClick={() => navigate('/app/ask')} className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)' }}>
              Explore Products
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, idx) => (
              <div key={item.id} className="card animate-fade-in" style={{
                display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 16px)', flexWrap: 'wrap',
                animationDelay: `${idx * 50}ms`, padding: 'clamp(12px, 3vw, 16px)'
              }}>
                <div style={{
                  width: '56px', height: '56px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', flexShrink: 0
                }}>
                  {item.image}
                </div>

                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                      background: 'var(--bg-subtle)', padding: '3px 10px',
                      borderRadius: 'var(--radius-full)', textTransform: 'capitalize'
                    }}>{item.category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      ★ {item.rating} · Added {item.addedDate}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>
                    ₹{item.price.toLocaleString()}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
