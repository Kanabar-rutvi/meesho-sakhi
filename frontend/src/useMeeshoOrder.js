/**
 * useMeeshoOrder.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook — Order Flow State Machine for Meesho Sakhi integration.
 *
 * States:
 *   idle         → Initial. "Order on Meesho" button shown.
 *   loading      → Fetching order payload from backend.
 *   detecting    → Attempting app detection (timer-based).
 *   app_prompt   → App not installed. Show store install cards.
 *   guide        → Main UX: per-product checklist with "Open in Meesho" buttons.
 *   complete     → All items reviewed. Show success message.
 *   error        → Something went wrong. Show error with retry.
 *
 * Transitions:
 *   startOrder()        → loading → detecting → guide | app_prompt
 *   skipDetection()     → guide (skip app check, go straight to guide)
 *   installApp()        → opens store, stays in app_prompt
 *   continueToGuide()   → guide (from app_prompt, user wants to use web)
 *   openProduct(item)   → opens Meesho search for that product in new tab
 *   markAdded(itemId)   → marks item as "added to cart" in guide
 *   markNotAdded(id)    → unchecks item
 *   finishOrder()       → complete
 *   reset()             → idle
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef, useMemo } from "react";
import {
  detectPlatform,
  detectMeeshoApp,
  openProductOnMeesho,
  openAllProductsOnMeesho,
  redirectToStore,
  prepareOrder,
} from "./meeshoService";

export const ORDER_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  DETECTING: "detecting",
  APP_PROMPT: "app_prompt",
  GUIDE: "guide",
  COMPLETE: "complete",
  ERROR: "error",
};

const DETECT_SKIP_TIMEOUT_MS = 3500; // if detection hangs, auto-proceed to guide

export function useMeeshoOrder(checkoutItems) {
  const [state, setState] = useState(ORDER_STATES.IDLE);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState("web");
  const [orderPayload, setOrderPayload] = useState(null); // backend payload
  const [addedItems, setAddedItems] = useState(new Set()); // item IDs marked added
  const [openedItems, setOpenedItems] = useState(new Set()); // items opened on Meesho
  const [allOpenedCount, setAllOpenedCount] = useState(0);  // tabs opened by open-all
  const detectTimeoutRef = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const safeSetState = useCallback((newState) => {
    setState(newState);
  }, []);

  const products = useMemo(() => orderPayload?.products || [], [orderPayload?.products]);
  const storeLinks = orderPayload?.store_links || {};
  const integrationInfo = orderPayload?.integration || {};
  const totalAdded = addedItems.size;
  const totalProducts = products.length;
  const allAdded = totalProducts > 0 && totalAdded >= totalProducts;
  const progress = totalProducts > 0 ? Math.round((totalAdded / totalProducts) * 100) : 0;

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Start the full order flow.
   * 1. Fetch backend order payload
   * 2. Detect platform
   * 3. Try app detection (mobile only)
   * 4. Transition to guide or app_prompt
   */
  const startOrder = useCallback(async () => {
    if (!checkoutItems || checkoutItems.length === 0) {
      setError("No items in cart to order.");
      safeSetState(ORDER_STATES.ERROR);
      return;
    }

    safeSetState(ORDER_STATES.LOADING);
    setError(null);

    try {
      // Fetch backend order payload
      const payload = await prepareOrder(checkoutItems);
      setOrderPayload(payload);

      // Detect platform
      const currentPlatform = detectPlatform();
      setPlatform(currentPlatform);

      if (currentPlatform === "web") {
        // Desktop — skip detection, go straight to guide
        safeSetState(ORDER_STATES.GUIDE);
        return;
      }

      // Mobile — attempt app detection
      safeSetState(ORDER_STATES.DETECTING);

      // Safety timeout: if detection takes too long, proceed to guide
      detectTimeoutRef.current = setTimeout(() => {
        safeSetState(ORDER_STATES.GUIDE);
      }, DETECT_SKIP_TIMEOUT_MS);

      const isInstalled = await detectMeeshoApp();
      clearTimeout(detectTimeoutRef.current);

      if (isInstalled) {
        // App opened successfully — user is now in the Meesho app
        // Wait briefly, then show guide for them to come back and check off items
        setTimeout(() => safeSetState(ORDER_STATES.GUIDE), 800);
      } else {
        safeSetState(ORDER_STATES.APP_PROMPT);
      }
    } catch (err) {
      setError(
        err.message?.includes("fetch")
          ? "Could not connect to backend. Make sure the server is running."
          : err.message || "Something went wrong. Please try again."
      );
      safeSetState(ORDER_STATES.ERROR);
    }
  }, [checkoutItems, safeSetState]);

  /** Skip app detection and go straight to guide. */
  const skipDetection = useCallback(() => {
    clearTimeout(detectTimeoutRef.current);
    safeSetState(ORDER_STATES.GUIDE);
  }, [safeSetState]);

  /** Open the app store to install Meesho. */
  const installApp = useCallback(() => {
    redirectToStore(platform);
  }, [platform]);

  /** User already has Meesho, or wants to use the web — go to guide. */
  const continueToGuide = useCallback(() => {
    safeSetState(ORDER_STATES.GUIDE);
  }, [safeSetState]);

  /** Open a product on Meesho search. */
  const openProduct = useCallback((product) => {
    openProductOnMeesho(product, platform);
    setOpenedItems((prev) => new Set([...prev, product.id]));
  }, [platform]);

  /**
   * Open ALL products simultaneously in new tabs.
   * Must be called directly from a click handler to avoid popup blockers.
   * After opening, marks all products as "opened" so the "Added ✓" button appears.
   */
  const openAll = useCallback(() => {
    const count = openAllProductsOnMeesho(products, platform);
    setAllOpenedCount(count);
    // Mark every product as opened so the "Added ✓" button becomes visible
    setOpenedItems(new Set(products.map((p) => p.id)));
  }, [products, platform]);

  /** Mark an item as added to cart. */
  const markAdded = useCallback((itemId) => {
    setAddedItems((prev) => new Set([...prev, itemId]));
  }, []);

  /** Unmark an item (undo). */
  const markNotAdded = useCallback((itemId) => {
    setAddedItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  /** Complete the flow. */
  const finishOrder = useCallback(() => {
    safeSetState(ORDER_STATES.COMPLETE);
  }, [safeSetState]);

  /** Reset everything. */
  const reset = useCallback(() => {
    clearTimeout(detectTimeoutRef.current);
    setState(ORDER_STATES.IDLE);
    setError(null);
    setOrderPayload(null);
    setAddedItems(new Set());
    setOpenedItems(new Set());
    setAllOpenedCount(0);
  }, []);

  return {
    // State
    state,
    error,
    platform,
    products,
    storeLinks,
    integrationInfo,
    addedItems,
    openedItems,
    allOpenedCount,
    totalAdded,
    totalProducts,
    allAdded,
    progress,
    // Actions
    startOrder,
    skipDetection,
    installApp,
    continueToGuide,
    openProduct,
    openAll,
    markAdded,
    markNotAdded,
    finishOrder,
    reset,
    setAllOpenedCount,
  };
}
