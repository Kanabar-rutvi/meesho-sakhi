/**
 * MeeshoOrderPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full Meesho ordering UX component.
 *
 * Renders one of several states driven by useMeeshoOrder():
 *   idle       → "Order on Meesho" CTA button
 *   loading    → skeleton / spinner while fetching backend payload
 *   detecting  → spinner while attempting app detection
 *   app_prompt → "Install Meesho" card with Play Store / App Store links
 *   guide      → per-product checklist with "Open in Meesho" buttons
 *   complete   → success card with confetti animation
 *   error      → error card with retry
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from "react";
import { useMeeshoOrder, ORDER_STATES } from "./useMeeshoOrder";
import { openAllProductsOnMeesho } from "./meeshoService";
import { CATEGORY_ICONS } from "./constants";

// ── Palette & tokens ─────────────────────────────────────────────────────────
const C = {
  meeshoPink: "#f43397",
  meeshoPinkLight: "#fce7f3",
  purple: "#9333ea",
  purpleDark: "#7c3aed",
  purpleLight: "#f3e8ff",
  green: "#16a34a",
  greenLight: "#dcfce7",
  amber: "#d97706",
  amberLight: "#fef3c7",
  red: "#dc2626",
  redLight: "#fef2f2",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate700: "#334155",
  slate900: "#0f172a",
};

const MEESHO_GRADIENT = "linear-gradient(135deg, #f43397 0%, #9333ea 100%)";
const MEESHO_GRADIENT_SOFT = "linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%)";


// ── Utility components ────────────────────────────────────────────────────────

function Spinner({ size = 24, color = C.meeshoPink }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${color}30`,
      borderTop: `3px solid ${color}`,
      borderRadius: "50%",
      animation: "meesho-spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function PulsingDot({ color = C.meeshoPink }) {
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: color,
      animation: "meesho-pulse 1.4s ease-in-out infinite",
    }} />
  );
}

function ProgressBar({ pct, color = C.meeshoPink }) {
  return (
    <div style={{
      height: 6, background: C.slate200,
      borderRadius: 4, overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${Math.min(pct, 100)}%`,
        background: MEESHO_GRADIENT,
        borderRadius: 4,
        transition: "width 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }} />
    </div>
  );
}

function InfoBanner({ icon, children, bg = C.amberLight, border = "#fde68a", color = "#92400e" }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "12px 14px",
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, fontSize: 12, color,
      lineHeight: 1.55,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "4px 0 12px",
    }}>
      <div style={{ flex: 1, height: 1, background: C.slate200 }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.slate200 }} />
    </div>
  );
}


// ── Product card (guide mode) ─────────────────────────────────────────────────

function GuideProductCard({ product, isAdded, isOpened, onOpen, onMarkAdded, onMarkNotAdded }) {
  const icon = CATEGORY_ICONS[product.category] || "📦";
  const stars = "★".repeat(Math.round(product.rating || 0)) + "☆".repeat(5 - Math.round(product.rating || 0));
  const trustPct = Math.round((product.trust_score || 0.7) * 100);
  const trustColor = trustPct >= 80 ? C.green : trustPct >= 60 ? C.amber : C.red;

  return (
    <div style={{
      border: `1.5px solid ${isAdded ? "#bbf7d0" : C.slate200}`,
      borderRadius: 12,
      background: isAdded ? "#f0fdf4" : "white",
      padding: "14px",
      transition: "all 0.25s ease",
      boxShadow: isAdded ? "0 0 0 3px #bbf7d040" : "none",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: isAdded ? C.greenLight : MEESHO_GRADIENT_SOFT,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
          transition: "background 0.25s",
        }}>
          {isAdded ? "✅" : icon}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: C.slate900,
            lineHeight: 1.35, marginBottom: 4,
          }}>
            {product.name}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
            {/* Category badge */}
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px",
              borderRadius: 20, background: C.purpleLight,
              color: C.purpleDark, textTransform: "capitalize",
            }}>
              {icon} {product.category}
            </span>
            {/* Qty */}
            {product.quantity > 1 && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 7px",
                borderRadius: 20, background: C.amberLight, color: C.amber,
              }}>
                Qty: {product.quantity}
              </span>
            )}
            {/* Trust */}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 7px",
              borderRadius: 20, background: `${trustColor}18`,
              color: trustColor, border: `1px solid ${trustColor}33`,
            }}>
              {trustPct}% trust
            </span>
          </div>

          {/* Rating */}
          <div style={{ fontSize: 11, color: C.amber, marginBottom: 2 }}>
            {stars}
            <span style={{ color: C.slate400, marginLeft: 4 }}>
              {(product.rating || 0).toFixed(1)} ({(product.reviews || 0).toLocaleString()} reviews)
            </span>
          </div>

          {/* Brand */}
          {product.brand && (
            <div style={{ fontSize: 11, color: C.slate500 }}>by {product.brand}</div>
          )}
        </div>

        {/* Price */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontSize: 17, fontWeight: 800,
            background: MEESHO_GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            ₹{(product.price || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {!isAdded ? (
          <>
            <button
              id={`open-meesho-${product.id}`}
              onClick={() => onOpen(product)}
              style={{
                flex: 1, padding: "9px 12px",
                background: isOpened ? C.purpleLight : MEESHO_GRADIENT,
                color: isOpened ? C.purpleDark : "white",
                border: isOpened ? `1.5px solid ${C.purple}` : "none",
                borderRadius: 8,
                fontWeight: 700, fontSize: 12,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.2s",
              }}
            >
              <span>🛍️</span>
              {isOpened ? "Open Again in Meesho" : "Open in Meesho"}
            </button>
            {isOpened && (
              <button
                id={`mark-added-${product.id}`}
                onClick={() => onMarkAdded(product.id)}
                style={{
                  flex: 1, padding: "9px 12px",
                  background: C.greenLight,
                  color: C.green,
                  border: `1.5px solid #86efac`,
                  borderRadius: 8,
                  fontWeight: 700, fontSize: 12,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  animation: "meesho-fade-in 0.3s ease",
                }}
              >
                ✓ Added to Cart
              </button>
            )}
          </>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 8,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 700, color: C.green,
            }}>
              <span>✅</span> Added to Meesho cart!
            </div>
            <button
              onClick={() => onMarkNotAdded(product.id)}
              style={{
                fontSize: 11, color: C.slate400,
                background: "none", border: "none",
                cursor: "pointer", padding: "2px 6px",
                textDecoration: "underline",
              }}
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ── State panels ──────────────────────────────────────────────────────────────

function LoadingPanel() {
  return (
    <div style={{
      padding: "32px 24px",
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 14,
      background: "white", borderRadius: 14,
      border: `1px solid ${C.slate200}`,
    }}>
      <Spinner size={36} />
      <div style={{ fontSize: 13, color: C.slate500, fontWeight: 600 }}>
        Preparing your Meesho order...
      </div>
      <div style={{ fontSize: 11, color: C.slate400 }}>
        Building search links for each product
      </div>
    </div>
  );
}

function DetectingPanel({ onSkip }) {
  return (
    <div style={{
      padding: "28px 24px",
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 14,
      background: "white", borderRadius: 14,
      border: `1.5px solid ${C.meeshoPinkLight}`,
      boxShadow: `0 0 20px ${C.meeshoPink}15`,
    }}>
      <div style={{ fontSize: 40 }}>📱</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Spinner size={20} color={C.meeshoPink} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.slate700 }}>
          Checking for Meesho app...
        </span>
      </div>
      <div style={{ fontSize: 11, color: C.slate400, textAlign: "center" }}>
        Attempting to open the Meesho app on your device
      </div>
      <button
        onClick={onSkip}
        style={{
          marginTop: 4, padding: "8px 20px",
          background: C.purpleLight,
          color: C.purpleDark,
          border: `1px solid #ddd6fe`,
          borderRadius: 8, fontWeight: 600, fontSize: 12,
          cursor: "pointer",
        }}
      >
        Skip — Open in Browser Instead
      </button>
    </div>
  );
}

function AppPromptPanel({ platform, storeLinks, onInstall, onContinueWeb }) {
  const isIOS = platform === "ios";
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.slate200}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    }}>
      {/* Header */}
      <div style={{
        background: MEESHO_GRADIENT,
        padding: "20px 24px", color: "white",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📲</div>
        <div style={{ fontWeight: 800, fontSize: 17, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Get the Meesho App
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
          For the best shopping experience, install Meesho on your device
        </div>
      </div>

      <div style={{ padding: "20px 24px", background: "white" }}>
        {/* Install button */}
        <button
          id={isIOS ? "install-meesho-appstore" : "install-meesho-playstore"}
          onClick={onInstall}
          style={{
            width: "100%", padding: "13px",
            background: MEESHO_GRADIENT,
            color: "white", border: "none",
            borderRadius: 10, fontWeight: 700, fontSize: 14,
            cursor: "pointer", marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>{isIOS ? "🍎" : "🤖"}</span>
          {isIOS ? "Download on App Store" : "Get it on Play Store"}
        </button>

        {/* Divider */}
        <SectionDivider label="Already installed or prefer web?" />

        {/* Continue without app */}
        <button
          id="continue-meesho-web"
          onClick={onContinueWeb}
          style={{
            width: "100%", padding: "11px",
            background: C.purpleLight,
            color: C.purpleDark,
            border: `1.5px solid #ddd6fe`,
            borderRadius: 10, fontWeight: 700, fontSize: 13,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          🌐 Continue in Browser
        </button>

        <div style={{ fontSize: 11, color: C.slate400, textAlign: "center", marginTop: 10 }}>
          You can search for and add each recommended product manually on Meesho
        </div>
      </div>
    </div>
  );
}

function GuidePanel({
  products, addedItems, openedItems, progress, totalAdded, totalProducts,
  allAdded, onOpen, onOpenAll, onMarkAdded, onMarkNotAdded, onFinish,
  integrationInfo, allOpenedCount,
}) {
  const limitationMessage =
    integrationInfo?.message ||
    "Meesho doesn't yet offer automatic cart transfer — tap each product below to open it on Meesho, then add it to your cart.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{
        background: MEESHO_GRADIENT,
        padding: "18px 20px", borderRadius: "14px 14px 0 0",
        color: "white",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 10,
        }}>
          <div>
            <div style={{
              fontWeight: 800, fontSize: 16,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: 2,
            }}>
              🛍️ Add to Meesho Cart
            </div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>
              {totalAdded} of {totalProducts} items ready
            </div>
          </div>
          {allAdded && (
            <div style={{
              background: "rgba(255,255,255,0.2)",
              padding: "6px 12px", borderRadius: 20,
              fontSize: 12, fontWeight: 700,
              animation: "meesho-fade-in 0.4s ease",
            }}>
              🎉 All Done!
            </div>
          )}
        </div>
        <ProgressBar pct={progress} />
      </div>

      {/* Limitation notice */}
      <div style={{ padding: "12px 14px", background: "#fffbeb", borderBottom: "1px solid #fef3c7" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
            <strong>Note:</strong> {limitationMessage}
          </span>
        </div>
      </div>

      {/* ── Open All banner ───────────────────────────────────────────── */}
      <div style={{
        padding: "12px 16px",
        background: allOpenedCount > 0 ? (allOpenedCount < products.length ? "#fff7ed" : "#f0fdf4") : "#fdf4ff",
        borderBottom: `1px solid ${allOpenedCount > 0 ? (allOpenedCount < products.length ? "#ffedd5" : "#bbf7d0") : "#e9d5ff"}`,
        display: "flex", alignItems: "center", gap: 10,
        transition: "background 0.3s",
      }}>
        <div style={{ flex: 1 }}>
          {allOpenedCount > 0 ? (
            allOpenedCount < products.length ? (
              <div style={{ fontSize: 12, fontWeight: 600, color: C.amber }}>
                ⚠️ Popups Blocked! Only opened {allOpenedCount} tabs. Please allow popups for this site and try again, or click each product individually.
              </div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 600, color: C.green }}>
                ✅ Opened {allOpenedCount} tabs! Switch to each tab and add items to cart.
              </div>
            )
          ) : (
            <div style={{ fontSize: 12, color: C.slate700, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700 }}>Open all {products.length} products at once</span>
              <span style={{ color: C.slate400 }}> — each in its own Meesho tab</span>
            </div>
          )}
        </div>
        <button
          id="meesho-open-all-btn"
          onClick={onOpenAll}
          style={{
            padding: "9px 16px",
            background: allOpenedCount > 0 ? (allOpenedCount < products.length ? "#fb923c" : C.greenLight) : MEESHO_GRADIENT,
            color: allOpenedCount > 0 ? (allOpenedCount < products.length ? "white" : C.green) : "white",
            border: allOpenedCount > 0 && allOpenedCount === products.length ? `1.5px solid #86efac` : "none",
            borderRadius: 8,
            fontWeight: 700, fontSize: 12,
            cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.25s ease",
            boxShadow: allOpenedCount > 0 ? "none" : "0 2px 10px rgba(244,51,151,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {allOpenedCount > 0 ? "↩ Open All Again" : `🚀 Open All ${products.length} in Meesho`}
        </button>
      </div>

      {/* Product list */}
      <div style={{
        background: C.slate50,
        padding: "16px",
        display: "flex", flexDirection: "column", gap: 10,
        maxHeight: 480,
        overflowY: "auto",
      }}>
        {products.map((product) => (
          <GuideProductCard
            key={product.id}
            product={product}
            isAdded={addedItems.has(product.id)}
            isOpened={openedItems.has(product.id)}
            onOpen={onOpen}
            onMarkAdded={onMarkAdded}
            onMarkNotAdded={onMarkNotAdded}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "14px 16px",
        background: "white",
        borderTop: `1px solid ${C.slate200}`,
        borderRadius: "0 0 14px 14px",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        {allAdded ? (
          <button
            id="meesho-finish-order"
            onClick={onFinish}
            style={{
              flex: 1, padding: "12px",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "white", border: "none",
              borderRadius: 10, fontWeight: 700, fontSize: 14,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              animation: "meesho-fade-in 0.4s ease",
            }}
          >
            ✅ I'm Done — View Summary
          </button>
        ) : (
          <>
            <div style={{
              flex: 1, fontSize: 12, color: C.slate500, lineHeight: 1.4,
            }}>
              Open each product in Meesho, add to cart, then tick it off above.
            </div>
            <button
              onClick={onFinish}
              style={{
                padding: "10px 16px",
                background: C.purpleLight,
                color: C.purpleDark,
                border: `1px solid #ddd6fe`,
                borderRadius: 10,
                fontWeight: 600, fontSize: 12,
                cursor: "pointer", flexShrink: 0,
              }}
            >
              Finish →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessPanel({ totalProducts, totalAdded, onReset }) {
  return (
    <div style={{
      borderRadius: 14,
      border: `1.5px solid #86efac`,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(22,163,74,0.12)",
    }}>
      {/* Confetti header */}
      <div style={{
        background: "linear-gradient(135deg, #16a34a, #15803d)",
        padding: "28px 24px",
        color: "white", textAlign: "center",
        position: "relative",
      }}>
        <div style={{ fontSize: 52, marginBottom: 8, animation: "meesho-bounce 0.6s ease" }}>🎉</div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800, fontSize: 20, marginBottom: 4,
        }}>
          Order Setup Complete!
        </div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          {totalAdded} of {totalProducts} items added to your Meesho cart
        </div>
      </div>

      <div style={{ padding: "20px 24px", background: "white" }}>
        <div style={{
          fontSize: 13, color: C.slate700, lineHeight: 1.6,
          marginBottom: 16, textAlign: "center",
        }}>
          Great job! Open the Meesho app to review your cart and complete your purchase. Your hostel setup is almost ready! 🏠
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          marginBottom: 12,
        }}>
          <div style={{
            padding: "12px", borderRadius: 10,
            background: C.greenLight, textAlign: "center",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{totalAdded}</div>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Items Added</div>
          </div>
          <div style={{
            padding: "12px", borderRadius: 10,
            background: C.purpleLight, textAlign: "center",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.purpleDark }}>{totalProducts}</div>
            <div style={{ fontSize: 11, color: C.purpleDark, fontWeight: 600 }}>Total Recommended</div>
          </div>
        </div>

        <InfoBanner icon="📦" bg={C.amberLight} border="#fde68a" color="#92400e">
          Open the Meesho app → Go to Cart → Review items → Place your order!
        </InfoBanner>

        <button
          id="meesho-start-over"
          onClick={onReset}
          style={{
            width: "100%", marginTop: 14, padding: "11px",
            background: C.slate100, color: C.slate700,
            border: `1px solid ${C.slate200}`,
            borderRadius: 10, fontWeight: 600, fontSize: 13,
            cursor: "pointer",
          }}
        >
          ↩ Start Over
        </button>
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div style={{
      borderRadius: 14,
      background: "#fef2f2",
      border: `1px solid #fecaca`,
      padding: "20px",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.red, marginBottom: 4 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 12, color: "#991b1b", lineHeight: 1.5 }}>
            {message}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          id="meesho-retry"
          onClick={onRetry}
          style={{
            flex: 1, padding: "10px",
            background: C.red, color: "white",
            border: "none", borderRadius: 8,
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}


// ── CSS keyframes injector ────────────────────────────────────────────────────

function MeeshoStyles() {
  const injected = useRef(false);
  if (!injected.current && typeof document !== "undefined") {
    injected.current = true;
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes meesho-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes meesho-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
      @keyframes meesho-fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes meesho-bounce {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }
      #meesho-cta-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(244,51,151,0.35) !important;
      }
      #meesho-cta-btn:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }
  return null;
}


// ── Main export ───────────────────────────────────────────────────────────────

export default function MeeshoOrderPanel({ items, total }) {
  const {
    state, error, platform,
    products, storeLinks, integrationInfo,
    addedItems, openedItems, allOpenedCount,
    totalAdded, totalProducts, allAdded, progress,
    startOrder, skipDetection, installApp, continueToGuide,
    openProduct, openAll, markAdded, markNotAdded, finishOrder, reset,
    setAllOpenedCount,
  } = useMeeshoOrder(items);

  return (
    <div style={{ width: "100%" }}>
      <MeeshoStyles />

      {/* ── IDLE: Main CTA ────────────────────────────────────────────── */}
      {state === ORDER_STATES.IDLE && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Primary CTA — guided flow */}
          <button
            id="meesho-cta-btn"
            onClick={startOrder}
            style={{
              width: "100%", padding: "14px 20px",
              background: "linear-gradient(135deg, #f43397 0%, #d91c78 100%)",
              color: "white", border: "none",
              borderRadius: "12px", fontWeight: 700, fontSize: "15px",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 6px 20px rgba(244,51,151,0.25)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(244,51,151,0.35)";
              e.currentTarget.style.background = "linear-gradient(135deg, #fb4aab 0%, #e82c88 100%)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(244,51,151,0.25)";
              e.currentTarget.style.background = "linear-gradient(135deg, #f43397 0%, #d91c78 100%)";
            }}
          >
            <span style={{ fontSize: 18 }}>🛍️</span>
            Order on Meesho
            <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>
              — {totalProducts || items?.length || 0} items · ₹{(total || 0).toLocaleString()}
            </span>
          </button>

          {/* Secondary CTA — open all tabs instantly */}
          <button
            id="meesho-open-all-quick-btn"
            onClick={() => {
              // Open synchronously to prevent popup blockers, using the raw items.
              const count = openAllProductsOnMeesho(items, platform);
              setAllOpenedCount(count);
              // Then transition to guide flow (loading -> guide)
              startOrder();
            }}
            title="Opens every recommended product in a separate Meesho tab all at once"
            style={{
              width: "100%", padding: "12px 20px",
              background: "white",
              color: C.meeshoPink,
              border: `1.5px solid ${C.meeshoPink}`,
              borderRadius: "12px", fontWeight: 700, fontSize: "14px",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.meeshoPinkLight;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: 16 }}>🚀</span>
            Open All {items?.length || 0} Products in Meesho Simultaneously
          </button>
        </div>
      )}

      {/* ── LOADING ───────────────────────────────────────────────────── */}
      {state === ORDER_STATES.LOADING && <LoadingPanel />}

      {/* ── DETECTING ────────────────────────────────────────────────── */}
      {state === ORDER_STATES.DETECTING && (
        <DetectingPanel onSkip={skipDetection} />
      )}

      {/* ── APP NOT INSTALLED ─────────────────────────────────────────── */}
      {state === ORDER_STATES.APP_PROMPT && (
        <AppPromptPanel
          platform={platform}
          storeLinks={storeLinks}
          onInstall={installApp}
          onContinueWeb={continueToGuide}
        />
      )}

      {/* ── GUIDE MODE ───────────────────────────────────────────────── */}
      {state === ORDER_STATES.GUIDE && (
        <div style={{
          borderRadius: 14,
          border: `1px solid ${C.slate200}`,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          animation: "meesho-fade-in 0.35s ease",
        }}>
          <GuidePanel
            products={products}
            addedItems={addedItems}
            openedItems={openedItems}
            progress={progress}
            totalAdded={totalAdded}
            totalProducts={totalProducts}
            allAdded={allAdded}
            onOpen={openProduct}
            onOpenAll={openAll}
            allOpenedCount={allOpenedCount}
            onMarkAdded={markAdded}
            onMarkNotAdded={markNotAdded}
            onFinish={finishOrder}
            integrationInfo={integrationInfo}
          />
        </div>
      )}

      {/* ── COMPLETE ─────────────────────────────────────────────────── */}
      {state === ORDER_STATES.COMPLETE && (
        <div style={{ animation: "meesho-fade-in 0.4s ease" }}>
          <SuccessPanel
            totalProducts={totalProducts}
            totalAdded={totalAdded}
            onReset={reset}
          />
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────────────── */}
      {state === ORDER_STATES.ERROR && (
        <ErrorPanel message={error} onRetry={reset} />
      )}
    </div>
  );
}
