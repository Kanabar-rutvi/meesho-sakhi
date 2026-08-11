/**
 * meeshoService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Meesho Integration Service — the single modular abstraction layer.
 *
 * IMPORTANT: Meesho does NOT provide a public developer API (as of 2025).
 *   - No cart injection API
 *   - No wishlist API
 *   - No product-specific deep link URI scheme
 *   - No public OAuth
 *
 * What IS supported (implemented here):
 *   ✅ Meesho Search URLs: https://www.meesho.com/search?q=<product>
 *   ✅ App open via meesho:// URI scheme (opens app home, not specific product)
 *   ✅ App detection via user-agent + intent-redirect heuristic
 *   ✅ Play Store / App Store install links
 *
 * UPGRADE PATH:
 *   When Meesho releases an official API, change INTEGRATION_STATUS below and
 *   implement injectToCart() / injectToWishlist(). Nothing else needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Constants ─────────────────────────────────────────────────────────────────

export const INTEGRATION_STATUS = {
  mode: "search_only",         // "search_only" | "cart_api" | "wishlist_api"
  canInjectCart: false,
  canInjectWishlist: false,
  canDeepLinkProduct: false,   // no official product URI scheme
  canDetectApp: true,
  supportsSearch: true,
  supportsAppOpen: true,
  supportsStoreInstall: true,
};

export const STORE_LINKS = {
  playStore: "https://play.google.com/store/apps/details?id=com.meesho.supply",
  appStore: "https://apps.apple.com/in/app/meesho-online-shopping-app/id1457958492",
  web: "https://www.meesho.com",
};

const MEESHO_SEARCH_BASE = "https://www.meesho.com/search?q=";
const MEESHO_APP_SCHEME = "meesho://";
const APP_DETECT_TIMEOUT_MS = 2500;


// ── Platform Detection ────────────────────────────────────────────────────────

/**
 * Detect the current platform from user-agent.
 * @returns {"android" | "ios" | "web"}
 */
export function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

/**
 * Check whether the Meesho app is likely installed using an intent-redirect
 * heuristic. Attempts to open meesho:// and waits to see if the page stays
 * in focus (app not installed) or blurs (app opened successfully).
 *
 * Note: This is the standard "intent timeout" pattern — there is no reliable
 * programmatic way to detect app installation in browsers.
 *
 * @returns {Promise<boolean>} true if app appears to be installed
 */
export function detectMeeshoApp() {
  return new Promise((resolve) => {
    const platform = detectPlatform();
    // Desktop — app cannot be installed
    if (platform === "web") {
      resolve(false);
      return;
    }

    let resolved = false;
    const safeResolve = (val) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    // If the page hides (visibilitychange / blur), the app opened successfully
    const onHide = () => {
      cleanup();
      safeResolve(true);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) onHide();
    });
    window.addEventListener("blur", onHide);

    const cleanup = () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onHide);
    };

    // Try opening the app
    window.location.href = MEESHO_APP_SCHEME;

    // Timeout — page still in focus, app likely not installed
    setTimeout(() => {
      cleanup();
      safeResolve(false);
    }, APP_DETECT_TIMEOUT_MS);
  });
}


// ── URL Builders ─────────────────────────────────────────────────────────────

/**
 * Build a Meesho search URL for a product name.
 * @param {string} productName
 * @returns {string}
 */
export function buildSearchUrl(productName) {
  return MEESHO_SEARCH_BASE + encodeURIComponent(productName.trim());
}

/**
 * Build the best available deep link for a product.
 * Since Meesho has no official product URI scheme, returns the search URL.
 * On mobile, the browser may trigger the app's in-app browser for meesho.com URLs.
 * @param {object} product — { name, search_url }
 * @param {"android"|"ios"|"web"} platform
 * @returns {string}
 */
export function buildProductLink(product, platform) {
  // Use search_url from backend if available (pre-computed)
  if (product.search_url) return product.search_url;
  return buildSearchUrl(product.name);
}


// ── Core Actions ─────────────────────────────────────────────────────────────

/**
 * Open a single product on Meesho (search page).
 * @param {object} product
 * @param {"android"|"ios"|"web"} platform
 */
export function openProductOnMeesho(product, platform) {
  const url = buildProductLink(product, platform);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Open ALL products on Meesho simultaneously in separate tabs.
 *
 * Browsers allow multiple window.open() calls when invoked synchronously
 * inside a user-initiated click handler (no popup-blocker triggers).
 * Each tab opens the Meesho search for that product.
 *
 * @param {Array} products — array of mapped products with search_url
 * @param {"android"|"ios"|"web"} platform
 * @returns {number} count of tabs opened
 */
export function openAllProductsOnMeesho(products, platform) {
  let opened = 0;
  products.forEach((product, i) => {
    const url = buildProductLink(product, platform);
    // Use unique target names so browsers don't coalesce them into one tab
    const target = `meesho_tab_${product.id || i}`;
    
    // window.open returns null if blocked by the popup blocker
    const tab = window.open(url, target, "noopener,noreferrer");
    if (tab) opened++;
  });
  return opened;
}

/**
 * Redirect to the appropriate app store for Meesho installation.
 * @param {"android"|"ios"|"web"} platform
 */
export function redirectToStore(platform) {
  const url =
    platform === "ios"
      ? STORE_LINKS.appStore
      : STORE_LINKS.playStore; // default to Play Store for web too
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Open Meesho home on web.
 */
export function openMeeshoWeb() {
  window.open(STORE_LINKS.web, "_blank", "noopener,noreferrer");
}


// ── Backend API ───────────────────────────────────────────────────────────────

const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
const API_BASE = `${envUrl}/meesho`;

/**
 * Fetch the order payload from the backend.
 * The backend maps internal catalog products to Meesho-ready format with
 * search URLs, app deep links, etc.
 *
 * @param {Array} items — raw checkout items from the pipeline
 * @returns {Promise<object>} — { integration, products, store_links, ... }
 */
export async function prepareOrder(items) {
  const response = await fetch(`${API_BASE}/prepare-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}


// ── FUTURE API STUBS ─────────────────────────────────────────────────────────
// Implement these when Meesho releases an official public API.

/**
 * FUTURE: Inject products directly into Meesho cart.
 * @throws {Error} always — not yet available
 */
export async function injectToCart(_products, _authToken) {
  throw new Error(
    "Meesho cart API is not publicly available. " +
    "This function will be implemented when Meesho releases an official cart API."
  );
}

/**
 * FUTURE: Add products to Meesho wishlist.
 * @throws {Error} always — not yet available
 */
export async function injectToWishlist(_products, _authToken) {
  throw new Error(
    "Meesho wishlist API is not publicly available. " +
    "This function will be implemented when Meesho releases an official wishlist API."
  );
}
