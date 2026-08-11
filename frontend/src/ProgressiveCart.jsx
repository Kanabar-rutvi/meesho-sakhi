import React, { useState } from 'react';
import { CATEGORY_ICONS } from "./constants";
import { X, HeartPulse, Sparkles, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

function StarRating({ rating }) {
  return (
    <span style={{ color: "var(--warning)", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function TrustBadge({ score }) {
  if (score == null) {
    return (
      <span style={{
        fontSize: "11px", fontWeight: 600,
        color: "var(--text-tertiary)",
        background: "var(--bg-subtle)",
        padding: "4px 8px", borderRadius: "var(--radius-full)",
        border: `1px dashed var(--slate-200)`,
        display: "inline-flex", alignItems: "center", gap: "4px"
      }}>
        <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
        Verifying…
      </span>
    );
  }
  const pct = Math.round((score || 0.7) * 100);
  const color = pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--error)";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700,
      color, background: `${color}18`,
      padding: "4px 8px", borderRadius: "var(--radius-full)", border: `1px solid ${color}33`,
      display: "inline-flex", alignItems: "center", gap: "4px",
      animation: "fadeIn 0.4s ease"
    }}>
      {pct >= 80 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
      {pct}% trust
    </span>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      display: "flex", gap: "16px", padding: "16px",
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--slate-200)",
      background: "var(--bg-subtle)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        width: "56px", height: "56px",
        borderRadius: "var(--radius-md)",
        background: "linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s linear infinite",
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{
          height: "18px", width: "75%", borderRadius: "6px",
          background: "linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s linear infinite",
        }} />
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{
            height: "22px", width: "80px", borderRadius: "11px",
            background: "linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s linear infinite",
          }} />
          <div style={{
            height: "22px", width: "64px", borderRadius: "11px",
            background: "linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.6s linear infinite",
          }} />
        </div>
        <div style={{
          height: "16px", width: "45%", borderRadius: "4px",
          background: "linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s linear infinite",
        }} />
      </div>
      <div style={{ width: "80px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
        <div style={{
          height: "24px", width: "72px", borderRadius: "4px",
          background: "linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s linear infinite",
        }} />
        <div style={{
          height: "12px", width: "48px", borderRadius: "3px",
          background: "linear-gradient(90deg, var(--slate-100) 25%, var(--slate-200) 50%, var(--slate-100) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s linear infinite",
        }} />
      </div>
    </div>
  );
}

function GeneratingTag() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "11px", fontWeight: 700,
      color: "var(--brand-primary)",
      background: "rgba(147,51,234,0.08)",
      padding: "3px 10px",
      borderRadius: "var(--radius-full)",
      letterSpacing: "0.3px",
      textTransform: "uppercase",
    }}>
      <Loader2 size={11} style={{ animation: "spin 0.9s linear infinite" }} />
      Sakhi is generating…
    </span>
  );
}

function ReadyTag() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "11px", fontWeight: 700,
      color: "var(--success)",
      background: "rgba(16,185,129,0.08)",
      padding: "3px 10px",
      borderRadius: "var(--radius-full)",
      letterSpacing: "0.3px",
      textTransform: "uppercase",
      animation: "fadeIn 0.3s ease",
    }}>
      <CheckCircle size={11} />
      Added
    </span>
  );
}

function CartItemLive({ item, trustScore, trustReason, itemReason, onShowReason }) {
  const icon = CATEGORY_ICONS[item.category] || "📦";
  return (
    <div style={{
      display: "flex", gap: "16px", padding: "16px",
      border: "1px solid var(--slate-200)",
      borderRadius: "var(--radius-md)",
      background: "var(--bg-card)",
      position: "relative",
      overflow: "hidden",
      animation: "slideIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
    }}>
      {/* Just-added highlight bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
        background: "linear-gradient(180deg, var(--brand-primary), var(--brand-secondary))",
        animation: "fadeOutBar 2.5s forwards",
      }} />

      <div style={{
        width: "56px", height: "56px",
        borderRadius: "var(--radius-md)",
        background: "linear-gradient(135deg, var(--purple-100), var(--brand-primary-light))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "28px", flexShrink: 0,
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)",
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px",
          color: "var(--text-primary)", lineHeight: 1.3, marginBottom: "8px",
        }}>
          {item.name}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600,
            color: "var(--brand-primary-dark)",
            background: "var(--purple-100)",
            padding: "4px 10px", borderRadius: "var(--radius-full)",
            textTransform: "capitalize",
          }}>
            {item.category}
          </span>
          <ReadyTag />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <StarRating rating={item.rating} />
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>({item.reviews.toLocaleString()} reviews)</span>
          <TrustBadge score={trustScore} />
        </div>

        <button
          onClick={() => onShowReason({ ...item, reason: itemReason || item.reason, trust_score: trustScore, trust_reason: trustReason })}
          disabled={!itemReason && !item.reason}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "none", border: "none",
            color: itemReason || item.reason ? "var(--brand-primary)" : "var(--text-tertiary)",
            fontSize: "13px", fontWeight: 600,
            cursor: itemReason || item.reason ? "pointer" : "not-allowed",
            padding: "4px 0",
            opacity: itemReason || item.reason ? 1 : 0.6,
          }}
        >
          <Sparkles size={14} />
          {itemReason || item.reason ? "Why Sakhi picked this" : "Reason being generated…"}
        </button>
      </div>

      <div style={{
        textAlign: "right", flexShrink: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div>
          <div style={{
            fontWeight: 800, fontSize: "20px",
            color: "var(--brand-primary)",
            fontFamily: "var(--font-display)",
            animation: "countUp 0.4s ease",
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

export default function ProgressiveCart({
  streamingExpected,
  streamingItems,
  streamingTotal,
  streamingCount,
  trustScores,
  itemReasons,
  status,
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  const expectedCats = streamingExpected?.categories || [];
  const budget = streamingExpected?.budget_total || 0;
  const saved = budget - streamingTotal;
  const utilization = budget > 0 ? Math.min(100, Math.round((streamingTotal / budget) * 100)) : 0;

  const itemsByCat = {};
  streamingItems.forEach(item => {
    if (!itemsByCat[item.category]) itemsByCat[item.category] = [];
    itemsByCat[item.category].push(item);
  });

  const displayCats = expectedCats.length > 0 ? expectedCats : Object.keys(itemsByCat);

  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "var(--radius-xl)",
      border: "2px solid rgba(147,51,234,0.12)",
      overflow: "hidden",
      boxShadow: "var(--shadow-lg)",
      animation: "fadeIn 0.3s ease",
    }}>
      {/* Header — live updating */}
      <div style={{
        background: status === "done"
          ? "linear-gradient(135deg, var(--success) 0%, #10b981 100%)"
          : "linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)",
        padding: "24px 32px", color: "white", position: "relative", overflow: "hidden",
        transition: "background 0.6s ease",
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
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", marginBottom: "6px",
              display: "flex", alignItems: "center", gap: "12px"
            }}>
              {status === "done" ? "🛍️ Smart Cart Ready" : "🛍️ Smart Cart (Live)"}
              {status === "running" && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  fontSize: "11px",
                  background: "rgba(255,255,255,0.18)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}>
                  <Loader2 size={12} style={{ animation: "spin 0.9s linear infinite" }} />
                  GENERATING
                </span>
              )}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.92, lineHeight: 1.5, maxWidth: "500px" }}>
              {status === "done"
                ? `Sakhi curated ${streamingCount} items optimized for quality and budget.`
                : streamingItems.length === 0
                ? "Sakhi's agents are selecting your personalized items. Watch them appear in real-time below."
                : `${streamingCount} item${streamingCount === 1 ? "" : "s"} added so far. Agents continue selecting…`}
            </div>
          </div>

          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <div style={{
              textAlign: "center", background: "rgba(0,0,0,0.18)",
              padding: "12px 18px", borderRadius: "var(--radius-lg)",
              backdropFilter: "blur(4px)",
              minWidth: "108px",
            }}>
              <div style={{
                fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px",
                opacity: 0.85, marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px",
                justifyContent: "center",
              }}>
                <HeartPulse size={14} /> Live Total
              </div>
              <div style={{
                fontSize: "26px", fontWeight: 800, fontFamily: "var(--font-display)",
                lineHeight: 1.1,
              }}>
                ₹{streamingTotal.toLocaleString()}
              </div>
              <div style={{
                fontSize: "11px", opacity: 0.8, marginTop: "4px",
                color: status === "running" ? "rgba(255,255,255,0.85)" : "white",
              }}>
                {streamingCount} items
              </div>
            </div>
          </div>
        </div>

        {/* Live budget bar */}
        {budget > 0 && (
          <div style={{ marginTop: "24px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "13px", fontWeight: 600, opacity: 0.92, marginBottom: "8px",
            }}>
              <span>
                Budget used: <span style={{ animation: "countUp 0.5s ease" }}>{utilization}%</span>
                <span style={{
                  fontSize: "11px", marginLeft: "8px",
                  opacity: 0.75, fontWeight: 500,
                }}>
                  (of ₹{budget.toLocaleString()})
                </span>
              </span>
              {saved > 0 && (
                <span style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "4px 12px", borderRadius: "var(--radius-full)",
                  fontWeight: 700,
                  animation: "fadeIn 0.4s ease",
                }}>
                  💰 Save ₹{saved.toLocaleString()}
                </span>
              )}
            </div>
            <div style={{
              height: "8px", background: "rgba(0,0,0,0.2)",
              borderRadius: "var(--radius-full)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${utilization}%`,
                background: utilization > 100
                  ? "linear-gradient(90deg, #fca5a5, #ef4444)"
                  : "white",
                borderRadius: "var(--radius-full)",
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: utilization > 100 ? "0 0 12px rgba(239,68,68,0.6)" : "none",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Items — categories with skeletons that turn into real rows */}
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {displayCats.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            color: "var(--text-tertiary)", fontSize: "13px",
          }}>
            <Loader2 size={24} style={{
              margin: "0 auto 12px",
              color: "var(--brand-primary)",
              animation: "spin 1s linear infinite",
            }} />
            Preparing to select your items…
          </div>
        ) : (
          displayCats.map(cat => {
            const catItems = itemsByCat[cat] || [];
            const catHasItems = catItems.length > 0;
            const maxSkeletons = 3;
            const skeletonCount = catHasItems
              ? Math.max(0, maxSkeletons - catItems.length)
              : 2;
            const catTotal = catItems.reduce((s, i) => s + i.price, 0);
            return (
              <div key={cat}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  marginBottom: "16px",
                  borderBottom: "2px solid var(--slate-100)",
                  paddingBottom: "8px",
                }}>
                  <span style={{ fontSize: "20px" }}>{CATEGORY_ICONS[cat] || "📦"}</span>
                  <span style={{
                    fontSize: "16px", fontWeight: 800,
                    color: "var(--text-primary)",
                    textTransform: "capitalize",
                    fontFamily: "var(--font-display)",
                  }}>
                    {cat}
                  </span>
                  {!catHasItems && <GeneratingTag />}
                  {catItems.length > 0 && status === "running" && skeletonCount > 0 && <GeneratingTag />}
                  <span style={{
                    fontSize: "14px", color: "var(--text-tertiary)",
                    marginLeft: "auto", fontWeight: 600,
                  }}>
                    {catHasItems ? `₹${catTotal.toLocaleString()}` : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {catItems.map(item => (
                    <CartItemLive
                      key={item.id}
                      item={item}
                      trustScore={trustScores[item.id]?.trust_score ?? (item.trust_score != null ? item.trust_score : null)}
                      trustReason={trustScores[item.id]?.trust_reason ?? item.trust_reason}
                      itemReason={itemReasons[item.id]?.reason ?? item.reason}
                      onShowReason={setSelectedItem}
                    />
                  ))}
                  {status === "running" && Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={`skel-${cat}-${i}`} style={{
                      opacity: 0.9,
                      animation: `fadeIn 0.3s ease ${i * 0.1}s both`,
                    }}>
                      <SkeletonRow />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reason modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '24px'
        }} onClick={() => setSelectedItem(null)}>
          <div style={{
            maxWidth: '500px', width: '100%', position: 'relative',
            padding: '32px',
            background: "var(--bg-card)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--slate-200)",
            boxShadow: "var(--shadow-lg)",
            animation: "fadeIn 0.2s ease",
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)'
            }}>
              <X size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                background: 'var(--purple-100)', color: 'var(--brand-primary)',
                padding: '12px', borderRadius: 'var(--radius-full)'
              }}>
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', margin: 0 }}>Why Sakhi Picked This</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: "4px 0 0 0" }}>{selectedItem.name}</p>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-subtle)', padding: '20px',
              borderRadius: 'var(--radius-md)', marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)',
                fontStyle: 'italic', margin: 0,
              }}>
                "{selectedItem.reason || "Sakhi selected this based on your preferences, budget, and trust signals."}"
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{
                  fontSize: '12px', color: 'var(--text-tertiary)',
                  fontWeight: 600, textTransform: 'uppercase'
                }}>Trust Score</div>
                <div style={{ marginTop: '4px' }}>
                  <TrustBadge score={selectedItem.trust_score} />
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '12px', color: 'var(--text-tertiary)',
                  fontWeight: 600, textTransform: 'uppercase'
                }}>Value</div>
                <div style={{
                  marginTop: '4px', fontSize: '14px', fontWeight: 600,
                  color: "var(--text-primary)",
                }}>₹{selectedItem.price.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          0% { opacity: 0; transform: translateY(8px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes countUp {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeOutBar {
          0% { opacity: 1; }
          70% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}