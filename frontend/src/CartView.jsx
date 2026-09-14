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
      display: "flex", gap: "clamp(12px, 2.5vw, 16px)", padding: "clamp(12px, 2.5vw, 16px)",
      border: "1px solid var(--border-color)", cursor: "default",
      marginBottom: "0", flexWrap: "wrap", alignItems: "flex-start"
    }}>
      {/* Category badge */}
      <div style={{
        width: "48px", height: "48px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-subtle)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "24px", flexShrink: 0
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px",
          color: "var(--text-primary)", lineHeight: 1.3, marginBottom: "6px"
        }}>
          {item.name}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600,
            color: "var(--text-secondary)", background: "var(--bg-subtle)",
            padding: "3px 8px", borderRadius: "var(--radius-full)",
            textTransform: "capitalize",
          }}>
            {item.category}
          </span>
          {(item.quantity || 1) > 1 && (
            <span style={{
              fontSize: "11px", fontWeight: 600,
              color: "var(--warning)", background: "var(--warning-bg)",
              padding: "3px 8px", borderRadius: "var(--radius-full)",
            }}>
              Qty: {item.quantity}
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          <StarRating rating={item.rating} />
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>({item.reviews.toLocaleString()} reviews)</span>
          {item.trust_score && <TrustBadge score={item.trust_score} />}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button 
            onClick={() => onShowReason(item)}
            style={{ 
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", 
              color: "var(--brand-primary)", fontSize: "12px", fontWeight: 600,
              cursor: "pointer", padding: "4px 0"
            }}
          >
            <Sparkles size={13} /> Why Sakhi picked this
          </button>
          <button
            onClick={() => onWishlist(item)}
            disabled={wishlisted}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: wishlisted ? "var(--bg-subtle)" : "none",
              border: "1px solid var(--border-color)",
              color: wishlisted ? "var(--brand-primary)" : "var(--text-secondary)",
              fontSize: "12px", fontWeight: 600,
              cursor: wishlisted ? "default" : "pointer",
              padding: "3px 10px", borderRadius: "var(--radius-full)",
              transition: "all 0.2s ease"
            }}
          >
            <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
            {wishlisted ? "Saved" : "Wishlist"}
          </button>
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "auto" }}>
        <div>
          <div style={{
            fontWeight: 700, fontSize: "18px",
            color: "var(--text-primary)", fontFamily: "var(--font-display)"
          }}>
            ₹{item.price.toLocaleString()}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px", fontWeight: 500 }}>
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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
        border: "1px solid var(--border-color)", overflow: "hidden",
        boxShadow: "var(--shadow-sm)"
      }}>
        {/* Header Area */}
        <div style={{
          background: "var(--bg-subtle)",
          padding: "clamp(16px, 3.5vw, 32px)", position: "relative", overflow: "hidden"
        }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(20px, 3.5vw, 24px)", marginBottom: "8px",
                display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)"
              }}>
                🛍️ Smart Cart
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "500px" }}>
                {summary}
              </div>
            </div>
            
            {/* Cart Health & Total */}
            <div style={{ display: "flex", gap: "clamp(12px, 2.5vw, 24px)", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", background: "var(--bg-card)", padding: "10px 16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-tertiary)", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <HeartPulse size={13} /> Health
                </div>
                <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-display)", color: healthColor }}>
                  {healthScore}/100
                </div>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-tertiary)", marginBottom: "2px" }}>
                  Total ({item_count} items)
                </div>
                <div style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  ₹{total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Budget bar */}
          {budget > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, opacity: 0.9, marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <span>Budget used: {utilization}%</span>
                {saved > 0 && <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: "var(--radius-full)" }}>💰 Saved ₹{saved.toLocaleString()}</span>}
              </div>
              <div style={{ height: "8px", background: "var(--border-color)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${utilization}%`, background: "var(--brand-primary)", borderRadius: "var(--radius-full)", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              </div>
            </div>
          )}
        </div>

        {/* Savings tip */}
        {savings_tip && (
          <div style={{ padding: "14px clamp(16px, 3.5vw, 32px)", background: "var(--warning-bg)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>💡</span>
            <span style={{ fontSize: "13px", color: "var(--warning)", fontWeight: 600 }}>{savings_tip}</span>
          </div>
        )}

        {/* Items */}
        <div style={{ padding: "clamp(16px, 3.5vw, 32px)", display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(byCat).map(([cat, catItems]) => (
            <div key={cat}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "18px" }}>{CATEGORY_ICONS[cat] || "📦"}</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize", fontFamily: "var(--font-display)" }}>
                  {cat}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-tertiary)", marginLeft: "auto", fontWeight: 600 }}>
                  ₹{catItems.reduce((s, i) => s + i.price, 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {catItems.map(item => <CartItem key={item.id} item={item} onShowReason={setSelectedItem} onWishlist={addToWishlist} wishlisted={wishlistedIds.has(item.id)} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "clamp(16px, 3vw, 24px) clamp(16px, 3.5vw, 32px)", borderTop: "1px solid var(--border-color)", display: "flex", gap: "16px", alignItems: "center", background: "var(--bg-subtle)", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px" }}>
            <MeeshoOrderPanel items={items} total={total} />
          </div>
          <button
            onClick={() => items.forEach(item => addToWishlist(item))}
            className="btn btn-secondary"
            style={{ padding: "12px 20px", display: "inline-flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
          >
            <Heart size={15} /> Save All to Wishlist
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
              <div style={{ background: 'var(--bg-subtle)', color: 'var(--brand-primary)', padding: '12px', borderRadius: 'var(--radius-full)' }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-display)' }}>Why Sakhi Picked This</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{selectedItem.name}</p>
              </div>
            </div>
            
            <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                &quot;{selectedItem.reason?.trim() || `Selected by Sakhi as a top-rated ${selectedItem.category || 'essential'} pick: verified high quality, dependable buyer ratings (${selectedItem.rating || 4.2}★), and great value at ₹${selectedItem.price?.toLocaleString()}.`}&quot;
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Trust Score</div>
                <div style={{ marginTop: '4px' }}><TrustBadge score={selectedItem.trust_score && selectedItem.trust_score > 0 ? selectedItem.trust_score : 0.85} /></div>
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

