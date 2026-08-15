import express from 'express';

const router = express.Router();

const INTEGRATION_CAPABILITY = {
    version: "1.0.0",
    mode: "search_only",
    can_inject_cart: false,
    can_inject_wishlist: false,
    can_deep_link_product: false,
    can_detect_app: true,
    supports_search_url: true,
    supports_app_open: true,
    supports_store_install: true,
    message: "Meesho does not provide a public API for automatic cart/wishlist transfer. We open a Meesho search for each recommended product so you can add it manually.",
    future_upgrade_note: "When Meesho releases an official cart/wishlist API, update INTEGRATION_CAPABILITY.mode and implement inject_to_cart() / inject_to_wishlist() in this file."
};

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.meesho.supply";
const APP_STORE_URL = "https://apps.apple.com/in/app/meesho-online-shopping-app/id1457958492";
const MEESHO_BASE_URL = "https://www.meesho.com";
const MEESHO_SEARCH_URL = "https://www.meesho.com/search?q=";
const MEESHO_APP_SCHEME = "meesho://";

function extractSearchTerm(product) {
    const name = (product.name || "").trim();
    const brand = (product.brand || "").trim();
    if (brand && brand.length < 20 && !name.toLowerCase().includes(brand.toLowerCase())) {
        return `${brand} ${name}`;
    }
    return name;
}

function mapProductToMeesho(product) {
    const search_term = extractSearchTerm(product);
    return {
        id: product.id || "",
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        price: product.price || 0,
        rating: product.rating || 0,
        reviews: product.reviews || 0,
        quantity: product.quantity || 1,
        trust_score: product.trust_score || 0,
        reason: product.reason || "",
        search_term: search_term,
        search_url: MEESHO_SEARCH_URL + encodeURIComponent(search_term),
        app_deep_link: MEESHO_APP_SCHEME,
    };
}

router.post('/prepare-order', (req, res) => {
    try {
        const items = req.body.items || [];
        const mapped_products = items.map(mapProductToMeesho);
        const total_price = mapped_products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        
        res.json({
            integration: INTEGRATION_CAPABILITY,
            products: mapped_products,
            store_links: {
                play_store: PLAY_STORE_URL,
                app_store: APP_STORE_URL,
                web: MEESHO_BASE_URL,
            },
            total_items: mapped_products.length,
            total_price: total_price,
        });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

router.get('/integration-status', (req, res) => {
    res.json(INTEGRATION_CAPABILITY);
});

export default router;
