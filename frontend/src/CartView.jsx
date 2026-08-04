import { CATEGORY_ICONS } from "./constants";

function StarRating({ rating }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: "12px" }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span style={{ color: "#64748b", marginLeft: "4px" }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function TrustBadge({ score }) {
  const pct = Math.round((score || 0.7) * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700,
      color, background: `${color}18`,
      padding: "2px 6px", borderRadius: "20px", border: `1px solid ${color}33`
    }}>
      {pct}% trust
    </span>
  );
}

function CartItem({ item }) {
  const icon = CATEGORY_ICONS[item.category] || "📦";
  return (
    <div style={{
      display: "flex",
      gap: "12px",
      padding: "14px",
      borderRadius: "12px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      transition: "box-shadow 0.2s",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(147,51,234,0.1)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Category badge */}
      <div style={{
        width: "44px", height: "44px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px", flexShrink: 0
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          fontSize: "13px",
          color: "#1a0533",
          lineHeight: 1.3,
          marginBottom: "4px"
        }}>
          {item.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
          <StarRating rating={item.rating} />
          <span style={{ fontSize: "10px", color: "#94a3b8" }}>({item.reviews.toLocaleString()} reviews)</span>
          {item.trust_score && <TrustBadge score={item.trust_score} />}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
          {item.reason}
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontWeight: 800,
          fontSize: "16px",
          color: "#9333ea",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          ₹{item.price.toLocaleString()}
        </div>
        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
          {item.brand}
        </div>
      </div>
    </div>
  );
}

export default function CartView({ checkout, goal }) {
  if (!checkout) return null;
  const { items, total, savings_tip, summary, item_count } = checkout;

  const budget = goal?.budget_total || 0;
  const saved = budget - total;
  const utilization = budget > 0 ? (total / budget * 100).toFixed(0) : 0;

  // Group by category
  const byCat = {};
  (items || []).forEach(item => {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
  });

  return (
    <div style={{
      background: "white",
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #ec4899 100%)",
        padding: "20px 24px",
        color: "white"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800, fontSize: "20px", marginBottom: "4px"
            }}>
              🛍️ Your Sakhi Cart
            </div>
            <div style={{ fontSize: "13px", opacity: 0.85, lineHeight: 1.5, maxWidth: "400px" }}>
              {summary}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ₹{total.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>{item_count} items</div>
          </div>
        </div>

        {/* Budget bar */}
        {budget > 0 && (
          <div style={{ marginTop: "16px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "11px", opacity: 0.8, marginBottom: "6px"
            }}>
              <span>Budget used: {utilization}%</span>
              {saved > 0 && <span>💰 Saved ₹{saved.toLocaleString()}</span>}
            </div>
            <div style={{
              height: "6px", background: "rgba(255,255,255,0.2)",
              borderRadius: "3px", overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${Math.min(utilization, 100)}%`,
                background: "white",
                borderRadius: "3px",
                transition: "width 0.8s ease"
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Savings tip */}
      {savings_tip && (
        <div style={{
          padding: "12px 24px",
          background: "#fffbeb",
          borderBottom: "1px solid #fef3c7",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          <span style={{ fontSize: "16px" }}>💡</span>
          <span style={{ fontSize: "12px", color: "#92400e", fontWeight: 500 }}>{savings_tip}</span>
        </div>
      )}

      {/* Items by category */}
      <div style={{ padding: "20px 24px" }}>
        {Object.entries(byCat).map(([cat, catItems]) => (
          <div key={cat} style={{ marginBottom: "20px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              marginBottom: "10px"
            }}>
              <span style={{ fontSize: "16px" }}>{CATEGORY_ICONS[cat] || "📦"}</span>
              <span style={{
                fontSize: "12px", fontWeight: 700,
                color: "#9333ea",
                textTransform: "uppercase", letterSpacing: "0.05em"
              }}>{cat}</span>
              <span style={{
                fontSize: "11px", color: "#94a3b8",
                marginLeft: "auto"
              }}>
                ₹{catItems.reduce((s, i) => s + i.price, 0).toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {catItems.map(item => <CartItem key={item.id} item={item} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{
        padding: "16px 24px",
        borderTop: "1px solid #e2e8f0",
        display: "flex", gap: "12px", alignItems: "center"
      }}>
        <button style={{
          flex: 1,
          padding: "12px",
          background: "linear-gradient(135deg, #9333ea, #ec4899)",
          color: "white",
          border: "none", borderRadius: "10px",
          fontWeight: 700, fontSize: "14px",
          cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          Order on Meesho →
        </button>
        <button style={{
          padding: "12px 16px",
          background: "#f3e8ff",
          color: "#9333ea",
          border: "1px solid #e9d5ff", borderRadius: "10px",
          fontWeight: 600, fontSize: "13px",
          cursor: "pointer"
        }}>
          Share List
        </button>
      </div>
    </div>
  );
}
