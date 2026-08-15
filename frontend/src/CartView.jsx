import React, { useState } from 'react';
import { CATEGORY_ICONS } from "./constants";
import MeeshoOrderPanel from "./MeeshoOrderPanel";
import { useAuth } from './AuthContext';
import { X, HeartPulse, Sparkles, CheckCircle, AlertTriangle, Heart } from 'lucide-react';


function StarRating({ rating }) {
  return (
    <span style={{ color: "var(--warning)", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function TrustBadge({ score }) {
  const pct = Math.round((score || 0.7) * 100);
  const color = pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--error)";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700,
      color, background: `${color}18`,
      padding: "4px 8px", borderRadius: "var(--radius-full)", border: `1px solid ${color}33`,
      display: "inline-flex", alignItems: "center", gap: "4px"
    }}>
      {pct >= 80 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
      {pct}% trust
    </span>
  );
}

function CartItem({ item, onShowReason, onWishlist, wishlisted }) {
  const icon = CATEGORY_ICONS[item.category] || "📦";
  return (
    <div className="card animate-fade-in" style={{
      display: "flex", gap: "16px", padding: "16px",
      border: "1px solid var(--slate-200)", cursor: "default",
      marginBottom: "0" // Override generic card margin if needed
    }}>
      {/* Category badge */}
      <div style={{
        width: "56px", height: "56px",
        borderRadius: "var(--radius-md)",
        background: "linear-gradient(135deg, var(--purple-100), var(--brand-primary-light))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "28px", flexShrink: 0,
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)"
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px",
          color: "var(--text-primary)", lineHeight: 1.3, marginBottom: "8px"
        }}>
          {item.name}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600,
            color: "var(--brand-primary-dark)", background: "var(--purple-100)",
            padding: "4px 10px", borderRadius: "var(--radius-full)",
            textTransform: "capitalize",
          }}>
            {item.category}
          </span>
          {(item.quantity || 1) > 1 && (
            <span style={{
              fontSize: "11px", fontWeight: 600,
              color: "#d97706", background: "#fef3c7",
              padding: "4px 10px", borderRadius: "var(--radius-full)",
            }}>
              Qty: {item.quantity}
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <StarRating rating={item.rating} />
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>({item.reviews.toLocaleString()} reviews)</span>
          {item.trust_score && <TrustBadge score={item.trust_score} />}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button 
            onClick={() => onShowReason(item)}
            style={{ 
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", 
              color: "var(--brand-primary)", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", padding: "4px 0"
            }}
          >
            <Sparkles size={14} /> Why Sakhi picked this
          </button>
          <button
            onClick={() => onWishlist(item)}
            disabled={wishlisted}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: wishlisted ? "rgba(236,72,153,0.08)" : "none",
              border: wishlisted ? "1px solid rgba(236,72,153,0.3)" : "1px solid var(--slate-200)",
              color: wishlisted ? "#ec4899" : "var(--text-secondary)",
              fontSize: "13px", fontWeight: 600,
              cursor: wishlisted ? "default" : "pointer",
              padding: "4px 12px", borderRadius: "var(--radius-full)",
              transition: "all 0.2s ease"
            }}
          >
            <Heart size={14} fill={wishlisted ? "#ec4899" : "none"} />
            {wishlisted ? "Saved" : "Wishlist"}
          </button>
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontWeight: 800, fontSize: "20px",
            color: "var(--brand-primary)", fontFamily: "var(--font-display)"
          }}>
            ₹{item.price.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px", fontWeight: 500 }}>
            {item.brand}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartView({ checkout, goal }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const { user } = useAuth();

  if (!checkout) return null;
  const { items, total, savings_tip, summary, item_count } = checkout;

  const budget = goal?.budget_total || 0;
  const saved = budget - total;
  const utilization = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  
  const avgTrust = items.reduce((sum, item) => sum + (item.trust_score || 0), 0) / (items.length || 1);
  const budgetScore = utilization <= 100 && utilization > 0 ? 100 - Math.abs(90 - utilization) : 50;
  const healthScore = Math.round((avgTrust * 100 * 0.6) + (budgetScore * 0.4));
  
  const healthColor = healthScore >= 85 ? 'var(--success)' : healthScore >= 70 ? 'var(--warning)' : 'var(--error)';

  const addToWishlist = async (item) => {
    if (!user) {
      alert("Please login to save items to your wishlist.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
      const baseUrl = envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
      const res = await fetch(`${baseUrl}/user/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: String(item.id),
          name: item.name,
          category: item.category,
          price: item.price,
          rating: item.rating || 4.0,
          image_url: null
        })
      });
      if (res.ok) {
        setWishlistedIds(prev => new Set([...prev, item.id]));
      } else {
        const err = await res.json();
        alert("Failed to save: " + (err.detail || "Unknown error"));
      }
    } catch (e) {
      console.error("Wishlist error:", e);
      alert("Could not save to wishlist. Check your connection.");
    }
  };

  const onShareList = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const itemsHtml = Object.entries(byCat).map(([cat, catItems]) => `
      <div style="margin-bottom: 20px;">
        <h3 style="text-transform: capitalize; border-bottom: 1px solid #ddd; padding-bottom: 4px;">${cat}</h3>
        <ul style="list-style: none; padding: 0;">
          ${catItems.map(item => `
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
              <div>
                <strong>${item.name}</strong><br/>
                <small>Qty: ${item.quantity || 1} | ${item.brand || ''}</small>
              </div>
              <div style="font-weight: bold;">₹${item.price.toLocaleString()}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Meesho Sakhi Shopping List</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            h1 { color: #db2777; border-bottom: 2px solid #db2777; padding-bottom: 10px; }
            .summary { background: #fdf2f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .total { font-size: 24px; font-weight: bold; text-align: right; margin-top: 30px; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Meesho Sakhi Shopping List</h1>
          <div class="summary">
            <strong>Goal:</strong> ${goal?.query || 'Shopping List'}<br/>
            <strong>Budget:</strong> ₹${budget.toLocaleString()}<br/>
            <strong>Total Cost:</strong> ₹${total.toLocaleString()}<br/>
            <strong>Items:</strong> ${item_count}
          </div>
          ${itemsHtml}
          <div class="total">Grand Total: ₹${total.toLocaleString()}</div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const byCat = {};
  (items || []).forEach(item => {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
  });

  return (
    <>
      <div style={{
        background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
        border: "1px solid var(--slate-200)", overflow: "hidden",
        boxShadow: "var(--shadow-lg)"
      }}>
        {/* Header Area */}
        <div style={{
          background: "linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)",
          padding: "32px", color: "white", position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: "-50%", right: "-10%",
            width: "300px", height: "300px",
            background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
            borderRadius: "50%", pointerEvents: "none"
          }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", marginBottom: "8px",
                display: "flex", alignItems: "center", gap: "12px"
              }}>
                🛍️ Smart Cart
              </div>
              <div style={{ fontSize: "15px", opacity: 0.9, lineHeight: 1.6, maxWidth: "500px" }}>
                {summary}
              </div>
            </div>
            
            {/* Cart Health & Total */}
            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <div style={{ textAlign: "center", background: "rgba(0,0,0,0.2)", padding: "12px 20px", borderRadius: "var(--radius-lg)" }}>
                <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8, marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <HeartPulse size={14} /> Cart Health
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-display)", color: healthColor }}>
                  {healthScore}/100
                </div>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8, marginBottom: "4px" }}>
                  Total ({item_count} items)
                </div>
                <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-display)" }}>
                  ₹{total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Budget bar */}
          {budget > 0 && (
            <div style={{ marginTop: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, opacity: 0.9, marginBottom: "8px" }}>
                <span>Budget used: {utilization}%</span>
                {saved > 0 && <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "var(--radius-full)" }}>💰 Saved ₹{saved.toLocaleString()}</span>}
              </div>
              <div style={{ height: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${utilization}%`, background: "white", borderRadius: "var(--radius-full)", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              </div>
            </div>
          )}
        </div>

        {/* Savings tip */}
        {savings_tip && (
          <div style={{ padding: "16px 32px", background: "#fefce8", borderBottom: "1px solid #fef08a", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>💡</span>
            <span style={{ fontSize: "14px", color: "#854d0e", fontWeight: 600 }}>{savings_tip}</span>
          </div>
        )}

        {/* Items */}
        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
          {Object.entries(byCat).map(([cat, catItems]) => (
            <div key={cat}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "2px solid var(--slate-100)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "20px" }}>{CATEGORY_ICONS[cat] || "📦"}</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", textTransform: "capitalize", fontFamily: "var(--font-display)" }}>
                  {cat}
                </span>
                <span style={{ fontSize: "14px", color: "var(--text-tertiary)", marginLeft: "auto", fontWeight: 600 }}>
                  ₹{catItems.reduce((s, i) => s + i.price, 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {catItems.map(item => <CartItem key={item.id} item={item} onShowReason={setSelectedItem} onWishlist={addToWishlist} wishlisted={wishlistedIds.has(item.id)} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "24px 32px", borderTop: "1px solid var(--slate-200)", display: "flex", gap: "16px", alignItems: "center", background: "var(--bg-subtle)", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <MeeshoOrderPanel items={items} total={total} />
          </div>
          <button
            onClick={() => items.forEach(item => addToWishlist(item))}
            className="btn btn-secondary"
            style={{ padding: "16px 24px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Heart size={16} /> Save All to Wishlist
          </button>
          <button onClick={onShareList} className="btn btn-secondary" style={{ padding: "16px 24px" }}>
            Share List
          </button>
        </div>
      </div>

      {/* Reasoning Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '24px'
        }} onClick={() => setSelectedItem(null)}>
          <div className="card animate-fade-in" style={{
            maxWidth: '500px', width: '100%', position: 'relative',
            padding: '32px'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)'
            }}>
              <X size={24} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--purple-100)', color: 'var(--brand-primary)', padding: '12px', borderRadius: 'var(--radius-full)' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-display)' }}>Why Sakhi Picked This</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{selectedItem.name}</p>
              </div>
            </div>
            
            <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                &quot;{selectedItem.reason}&quot;
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Trust Score</div>
                <div style={{ marginTop: '4px' }}><TrustBadge score={selectedItem.trust_score} /></div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Value</div>
                <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: 600 }}>₹{selectedItem.price.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

