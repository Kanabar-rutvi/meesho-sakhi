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
    if (user === null) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      const fetchWishlist = async () => {
        try {
          const token = localStorage.getItem('token');
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
            <p style={{ color: 'var(--text-secondary)' }}>Items you save from Sakhi&apos;s recommendations will appear here.</p>
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
