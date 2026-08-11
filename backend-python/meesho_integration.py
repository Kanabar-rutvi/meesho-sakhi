"""
meesho_integration.py
---------------------
Meesho Integration Layer for Meesho Sakhi.

IMPORTANT — API Status (as of 2025):
  Meesho does NOT provide a public developer API for:
    - Cart injection
    - Wishlist manipulation
    - Product-specific deep links
    - OAuth / login flows

  What IS officially supported (implemented here):
    - Meesho Search URLs: https://www.meesho.com/search?q=<product>
    - App URI scheme: meesho:// (opens app, no product-specific routing)
    - Play Store / App Store install links

Architecture note:
  This file is the SINGLE point of upgrade when Meesho releases an official API.
  The /meesho/prepare-order endpoint in main.py calls only this module.
"""

from urllib.parse import quote_plus

# ─────────────────────────────────────────────────────────────────────────────
# Integration capability manifest — kept in sync with what is actually wired up.
# Frontend reads this from the API response to render the correct UX mode.
# ─────────────────────────────────────────────────────────────────────────────
INTEGRATION_CAPABILITY = {
    "version": "1.0.0",
    "mode": "search_only",          # upgrade to "cart_api" or "wishlist_api" when available
    "can_inject_cart": False,
    "can_inject_wishlist": False,
    "can_deep_link_product": False,  # no official product URI scheme
    "can_detect_app": True,          # via user-agent heuristic on client side
    "supports_search_url": True,
    "supports_app_open": True,       # meesho:// scheme
    "supports_store_install": True,
    "message": (
        "Meesho does not provide a public API for automatic cart/wishlist transfer. "
        "We open a Meesho search for each recommended product so you can add it manually."
    ),
    "future_upgrade_note": (
        "When Meesho releases an official cart/wishlist API, update INTEGRATION_CAPABILITY.mode "
        "and implement inject_to_cart() / inject_to_wishlist() in this file."
    ),
}

# Official store URLs
PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.meesho.supply"
APP_STORE_URL = "https://apps.apple.com/in/app/meesho-online-shopping-app/id1457958492"
MEESHO_BASE_URL = "https://www.meesho.com"
MEESHO_SEARCH_URL = "https://www.meesho.com/search?q={query}"
MEESHO_APP_SCHEME = "meesho://"  # opens the Meesho app (no product routing officially)


def build_search_url(product_name: str) -> str:
    """
    Build an official Meesho search URL for a product name.
    Example: "Adjustable Study Table Lamp LED" → "https://www.meesho.com/search?q=Adjustable+Study+Table+Lamp+LED"
    """
    encoded = quote_plus(product_name.strip())
    return MEESHO_SEARCH_URL.format(query=encoded)


def build_app_deep_link(product_name: str) -> str:
    """
    Build the best available app deep link for Meesho.
    Meesho has no documented product-level URI scheme, so we use
    the base app scheme only. The client will fall back to the search URL.
    """
    return MEESHO_APP_SCHEME


def _extract_search_term(product: dict) -> str:
    """
    Build an optimised search term for a product.
    Strategy: use the product name directly (most reliable for manual search).
    Strip internal codes or IDs. Include brand if available to narrow results.
    """
    name = product.get("name", "").strip()
    brand = product.get("brand", "").strip()

    # Use "Brand ProductName" if brand is short and meaningful
    if brand and len(brand) < 20 and brand.lower() not in name.lower():
        return f"{brand} {name}"
    return name


def map_product_to_meesho(product: dict) -> dict:
    """
    Map an internal catalog product to the Meesho-ready integration format.

    Input product fields (from catalog.json / checkout agent):
        id, name, category, price, rating, reviews, brand, tags,
        quantity, trust_score, reason

    Output fields:
        id, name, brand, category, price, rating, reviews,
        quantity, search_term, search_url, app_deep_link,
        trust_score, reason
    """
    search_term = _extract_search_term(product)
    return {
        "id": product.get("id", ""),
        "name": product.get("name", ""),
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "price": product.get("price", 0),
        "rating": product.get("rating", 0),
        "reviews": product.get("reviews", 0),
        "quantity": product.get("quantity", 1),
        "trust_score": product.get("trust_score", 0),
        "reason": product.get("reason", ""),
        # Meesho integration fields
        "search_term": search_term,
        "search_url": build_search_url(search_term),
        "app_deep_link": build_app_deep_link(search_term),
    }


def prepare_order_payload(items: list) -> dict:
    """
    Build the complete order payload that the frontend MeeshoOrderPanel consumes.

    Returns:
        {
            "integration": { ...INTEGRATION_CAPABILITY },
            "products": [ ...mapped products ],
            "store_links": { "play_store": "...", "app_store": "...", "web": "..." },
            "total_items": int,
            "total_price": int,
        }
    """
    mapped_products = [map_product_to_meesho(item) for item in items]
    total_price = sum(p["price"] * p["quantity"] for p in mapped_products)

    return {
        "integration": INTEGRATION_CAPABILITY,
        "products": mapped_products,
        "store_links": {
            "play_store": PLAY_STORE_URL,
            "app_store": APP_STORE_URL,
            "web": MEESHO_BASE_URL,
        },
        "total_items": len(mapped_products),
        "total_price": total_price,
    }


# ─────────────────────────────────────────────────────────────────────────────
# FUTURE API STUBS
# Implement these when Meesho releases an official public API.
# ─────────────────────────────────────────────────────────────────────────────

def inject_to_cart(products: list, auth_token: str) -> dict:
    """
    FUTURE: Inject products directly into Meesho cart via official API.
    Not yet available — raises NotImplementedError.
    """
    raise NotImplementedError(
        "Meesho cart API is not publicly available. "
        "Implement this function when Meesho releases an official cart integration API."
    )


def inject_to_wishlist(products: list, auth_token: str) -> dict:
    """
    FUTURE: Add products to Meesho wishlist via official API.
    Not yet available — raises NotImplementedError.
    """
    raise NotImplementedError(
        "Meesho wishlist API is not publicly available. "
        "Implement this function when Meesho releases an official wishlist integration API."
    )
