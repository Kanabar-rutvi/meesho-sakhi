import {
  combinedIntentAgent, filterAgent, rankerAgent,
  selectorAgent, reviewAgent, recommendAgent, checkoutAgent
} from './agents.js';
import { getProductById } from './catalog.js';
import prisma from './db.js';
import { PreferenceEngine } from './preferenceEngine.js';
import { routeIntent } from './intentRouter.js';
import { resolveProductReference, describeProduct } from './productReferenceResolver.js';
import { encryptMessage } from './conversationEncryption.js';

export class AgentOrchestrator {
  constructor(catalog, userId = null, sessionId = null, conversationId = null, conversationContext = null) {
    this.catalog = catalog;
    this.userId = userId;
    this.sessionId = sessionId;
    this.conversationId = conversationId;
    this.conversationContext = conversationContext;
    this.preferences = new PreferenceEngine(userId);
    this.runningTotal = 0;
    this.runningItems = [];
    this.goalData = null;
  }

  _formatSSE(type, data) {
    return `data: ${JSON.stringify({ type, ...data })}\n\n`;
  }

  async _logActivity(data) {
    try {
      await prisma.activityLog.create({
        data: {
          ...(this.userId ? { user: { connect: { id: this.userId } } } : {}),
          conversation_id: this.conversationId,
          ...data
        }
      });
    } catch (e) {
      console.error("[AgentOrchestrator] Failed to write activity log:", e.message);
    }
  }

  async *executeFullPlan(query) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    try {
      const route = routeIntent(query);

      // --- Context-aware routing for all non-fresh-shopping intents ---
      let combined = null;

      // ── product_detail: "tell me more about the second one" ──────────────────
      if (route.intent === 'product_detail') {
        const lastProds = this.conversationContext?.lastProducts || [];
        const { product } = resolveProductReference(query, lastProds);
        const message = product
          ? describeProduct(product)
          : "I don't have a product to describe from our last conversation. Could you tell me which product you mean?";

        await this._logActivity({
          event_type: 'chat_started',
          intent: route.intent,
          message_summary: `Consultation (${route.intent})`,
          metadata: JSON.stringify({
            encrypted_user_message: encryptMessage(query),
            encrypted_assistant_message: encryptMessage(message)
          }),
          request_id: requestId,
          duration_ms: Date.now() - startTime,
          success: true
        });
        const { updateContext } = await import('./conversationContext.js');
        updateContext(this.conversationId, { lastIntent: route.intent, lastResponse: message, lastSelectedProduct: product || undefined });
        const prevTotal = lastProds.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
        yield this._formatSSE('complete', { checkout: { items: lastProds, total: prevTotal, summary: message, item_count: lastProds.length }, goal: { budget_total: this.conversationContext?.lastBudget || 0, query } });
        return;
      }

      // ── product_question: "which one is cheapest?" ────────────────────────────
      if (route.intent === 'product_question' && this.conversationContext?.lastProducts?.length > 0) {
        const lastProds = [...this.conversationContext.lastProducts];
        const q = query.toLowerCase();
        let message;

        // Try to resolve to a specific product first
        const { product: refProduct } = resolveProductReference(query, lastProds);

        if (q.includes('price') && refProduct) {
          message = `The price of **${refProduct.name}** is ₹${refProduct.price}.`;
        } else if (q.includes('cheap') || q.includes('affordable') || q.includes('lowest')) {
          lastProds.sort((a, b) => a.price - b.price);
          message = `The cheapest option is **${lastProds[0].name}** at ₹${lastProds[0].price}.`;
        } else if (q.includes('expensive') || q.includes('premium') || q.includes('highest price')) {
          lastProds.sort((a, b) => b.price - a.price);
          message = `The most expensive option is **${lastProds[0].name}** at ₹${lastProds[0].price}.`;
        } else if (q.includes('best') || q.includes('rating') || q.includes('rated')) {
          lastProds.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          message = `The highest rated option is **${lastProds[0].name}** with a rating of ${lastProds[0].rating}⭐.`;
        } else if (q.includes('review') || q.includes('popular')) {
          lastProds.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
          message = `**${lastProds[0].name}** has the most reviews (${lastProds[0].reviews}).`;
        } else if (refProduct) {
          message = describeProduct(refProduct);
        } else {
          message = `Based on what I showed you: the cheapest is **${[...lastProds].sort((a,b)=>a.price-b.price)[0].name}** at ₹${[...lastProds].sort((a,b)=>a.price-b.price)[0].price}, and the best rated is **${[...lastProds].sort((a,b)=>(b.rating||0)-(a.rating||0))[0].name}** at ${[...lastProds].sort((a,b)=>(b.rating||0)-(a.rating||0))[0].rating}⭐.`;
        }

        await this._logActivity({
          event_type: 'chat_started',
          intent: route.intent,
          message_summary: `Consultation (${route.intent})`,
          metadata: JSON.stringify({
            encrypted_user_message: encryptMessage(query),
            encrypted_assistant_message: encryptMessage(message)
          }),
          request_id: requestId,
          duration_ms: Date.now() - startTime,
          success: true
        });
        const { updateContext } = await import('./conversationContext.js');
        updateContext(this.conversationId, { lastIntent: route.intent, lastResponse: message });
        const prevTotal = this.conversationContext.lastProducts.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
        yield this._formatSSE('complete', { checkout: { items: this.conversationContext.lastProducts, total: prevTotal, summary: message, item_count: this.conversationContext.lastProducts.length }, goal: { budget_total: this.conversationContext?.lastBudget || 0, query } });
        return;
      }

      // ── plan_info: "what is in my plan?", "show my cart" ───────────────────────
      if (route.intent === 'plan_info') {
        const lastProds = this.conversationContext?.lastProducts || [];
        const total = lastProds.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
        let message = "";
        if (lastProds.length === 0) {
          message = "You don't have any items in your current plan yet. What would you like to shop for?";
        } else {
          const itemsList = lastProds.map((p, idx) => `${idx + 1}. **${p.name}** — ₹${p.price}`).join('\n');
          message = `Here are the items currently in your plan:\n\n${itemsList}\n\n**Total:** ₹${total.toLocaleString('en-IN')}`;
        }

        await this._logActivity({ event_type: 'chat_started', intent: route.intent, message_summary: query.substring(0, 200), request_id: requestId, duration_ms: Date.now() - startTime, success: true });
        const { updateContext } = await import('./conversationContext.js');
        updateContext(this.conversationId, { lastIntent: route.intent, lastResponse: message });
        yield this._formatSSE('complete', { checkout: { items: lastProds, total, summary: message, item_count: lastProds.length }, goal: { budget_total: this.conversationContext?.lastBudget || total, query } });
        return;
      }

      // ── item_removal: "remove the shoes", "delete pillow" ──────────────────────
      if (route.intent === 'item_removal') {
        const itemRef = (route.item_ref || '').toLowerCase();
        let lastProds = [...(this.conversationContext?.lastProducts || [])];
        let removedProduct = null;

        if (lastProds.length > 0 && itemRef) {
          const idx = lastProds.findIndex(p => 
            p.name.toLowerCase().includes(itemRef) || 
            (p.category && p.category.toLowerCase().includes(itemRef)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(itemRef)))
          );

          if (idx !== -1) {
            removedProduct = lastProds[idx];
            lastProds.splice(idx, 1);
          } else if (itemRef.includes('first') && lastProds.length >= 1) {
            removedProduct = lastProds.shift();
          } else if (itemRef.includes('second') && lastProds.length >= 2) {
            removedProduct = lastProds.splice(1, 1)[0];
          } else if (itemRef.includes('last') && lastProds.length >= 1) {
            removedProduct = lastProds.pop();
          }
        }

        const newTotal = lastProds.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
        const message = removedProduct
          ? `I've removed **${removedProduct.name}** (₹${removedProduct.price}) from your plan. Your updated total is ₹${newTotal.toLocaleString('en-IN')}.`
          : `I couldn't find "${itemRef}" in your current plan. Your items are unchanged.`;

        await this._logActivity({ event_type: 'chat_started', intent: route.intent, message_summary: query.substring(0, 200), request_id: requestId, duration_ms: Date.now() - startTime, success: true });
        const { updateContext } = await import('./conversationContext.js');
        updateContext(this.conversationId, { lastIntent: route.intent, lastResponse: message, lastProducts: lastProds });
        yield this._formatSSE('complete', { checkout: { items: lastProds, total: newTotal, summary: message, item_count: lastProds.length }, goal: { budget_total: this.conversationContext?.lastBudget || newTotal, query } });
        return;
      }

      // ── preference_update: "i don't like black", "avoid red" ──────────────────
      if (route.intent === 'preference_update') {
        const pref = (route.preference || '').toLowerCase();
        let lastProds = [...(this.conversationContext?.lastProducts || [])];
        const disliked = lastProds.filter(p => 
          p.name.toLowerCase().includes(pref) || 
          (p.tags && p.tags.some(t => t.toLowerCase().includes(pref)))
        );

        const remaining = lastProds.filter(p => !disliked.includes(p));
        const message = disliked.length > 0
          ? `Got it! I've noted your preference to avoid ${pref} and removed ${disliked.map(d => d.name).join(', ')} from your plan.`
          : `Got it! I will avoid ${pref} in your recommendations.`;

        const newTotal = remaining.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
        await this._logActivity({ event_type: 'chat_started', intent: route.intent, message_summary: query.substring(0, 200), request_id: requestId, duration_ms: Date.now() - startTime, success: true });
        const { updateContext } = await import('./conversationContext.js');
        updateContext(this.conversationId, { lastIntent: route.intent, lastResponse: message, lastProducts: remaining });
        yield this._formatSSE('complete', { checkout: { items: remaining, total: newTotal, summary: message, item_count: remaining.length }, goal: { budget_total: this.conversationContext?.lastBudget || newTotal, query } });
        return;
      }

      // ── budget_change: "make it under 500", "reduce budget to 2000" ───────────
      const availableCategories = this.conversationContext?.lastCategories || 
        (this.conversationContext?.lastProducts ? [...new Set(this.conversationContext.lastProducts.map(p => p.category))] : null);

      if (route.intent === 'budget_change' && availableCategories) {
        const budgetMatch = query.match(/(\d+)/);
        const newBudget = budgetMatch ? parseInt(budgetMatch[1]) : (this.conversationContext?.lastBudget || 5000);
        const categories = availableCategories;
        const planCategories = categories.map(c => ({ name: c, budget: Math.floor(newBudget / categories.length), must_have: [], nice_to_have: [], max_items: 3 }));
        combined = { goal: { budget_total: newBudget, budget_per_category: Object.fromEntries(categories.map(c => [c, Math.floor(newBudget / categories.length)])), query }, plan: { name: 'Budget Change Plan', total_budget: newBudget, categories: planCategories } };
      }

      // ── category_change: "show electronics instead" ───────────────────────────
      if (route.intent === 'category_change') {
        const q2 = query.toLowerCase();
        const LEGACY_CATS = ['bedding','study','kitchen','storage','electronics','hygiene'];
        const newCat = LEGACY_CATS.find(c => q2.includes(c));
        if (newCat) {
          const budget = this.conversationContext?.lastBudget || 5000;
          combined = { goal: { budget_total: budget, budget_per_category: { [newCat]: budget }, query }, plan: { name: 'Category Change Plan', total_budget: budget, categories: [{ name: newCat, budget, must_have: [], nice_to_have: [], max_items: 3 }] } };
        }
      }

      // ── shopping_followup: "show me cheaper", "show more" ─────────────────────
      if (route.intent === 'shopping_followup' && availableCategories && !combined) {
        const q2 = query.toLowerCase();
        let newBudget = this.conversationContext?.lastBudget || 5000;
        if (q2.includes('cheap')) newBudget = Math.floor(newBudget * 0.7);
        else if (q2.includes('better') || q2.includes('premium')) newBudget = Math.floor(newBudget * 1.3);
        const categories = availableCategories;
        const planCategories = categories.map(c => ({ name: c, budget: Math.floor(newBudget / categories.length), must_have: [], nice_to_have: [], max_items: 3 }));
        combined = { goal: { budget_total: newBudget, budget_per_category: Object.fromEntries(categories.map(c => [c, Math.floor(newBudget / categories.length)])), query }, plan: { name: 'Followup Plan', total_budget: newBudget, categories: planCategories } };
      }

      // Bypass shopping pipeline for purely conversational intents (when no shopping plan is to be generated)
      if (!combined && route.intent !== "shopping" && route.intent !== "shopping_followup") {
        const message = route.message || "I can help answer questions about your products. How can I assist you today?";
        
        await this._logActivity({
          event_type: 'chat_started',
          intent: route.intent,
          message_summary: `Consultation (${route.intent})`,
          metadata: JSON.stringify({
            encrypted_user_message: encryptMessage(query),
            encrypted_assistant_message: encryptMessage(message)
          }),
          request_id: requestId,
          duration_ms: Date.now() - startTime,
          success: true
        });

        // Update context
        const { updateContext } = await import('./conversationContext.js');
        updateContext(this.conversationId, {
          lastIntent: route.intent,
          lastResponse: message
        });

        const lastProds = this.conversationContext?.lastProducts || [];
        const prevTotal = lastProds.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
        yield this._formatSSE("complete", {
          checkout: {
            items: lastProds,
            total: prevTotal,
            summary: message,
            item_count: lastProds.length
          },
          goal: { budget_total: this.conversationContext?.lastBudget || 0, query }
        });
        return;
      }
      
      await this._logActivity({
        event_type: 'shopping_request',
        intent: route.intent,
        message_summary: `Shopping Request (${route.intent})`,
        metadata: JSON.stringify({
          encrypted_user_message: encryptMessage(query)
        }),
        request_id: requestId,
      });


      // Run preferences load and wishlist fetch concurrently — they are independent reads.
      const wishlistPromise = this.userId
        ? prisma.wishlistItem.findMany({
            where: { user_id: this.userId },
            select: { product_id: true, name: true, category: true, price: true, rating: true }
          })
        : Promise.resolve([]);

      const [, wishlist] = await Promise.all([this.preferences.load(), wishlistPromise]);

      // Auto-learn from user's wishlist to improve current recommendations
      if (this.userId && wishlist.length > 0) {
        try {
          for (const item of wishlist) {
            this.preferences._learnProduct({
              id: item.product_id,
              name: item.name,
              category: item.category,
              price: item.price,
              rating: item.rating || 4.0,
              tags: [],
            }, 'save', 1);
          }
          await this.preferences.persist();
        } catch (e) {
          console.warn("[Orchestrator] Failed to learn from wishlist:", e.message);
        }
      }

      const prefInsights = this.preferences.getInsights();

      let goal, plan;
      
      if (combined) {
        goal = combined.goal;
        plan = combined.plan;
        this.goalData = goal;
      } else {
        yield this._formatSSE("agent_start", { agent: "goal", label: "Goal Agent", message: "Understanding your shopping goal..." });
        combined = await combinedIntentAgent(query, this.preferences);
        goal = combined.goal;
        plan = combined.plan;
        this.goalData = goal;
        yield this._formatSSE("agent_done", { agent: "goal", label: "Goal Agent", result: goal });
      }

      // Let frontend know categories + total expected so it can pre-render skeleton groups
      const expectedCats = Object.keys(goal.budget_per_category || {});
      yield this._formatSSE("cart_expected", {
        categories: expectedCats,
        budget_total: goal.budget_total || 0,
      });

      yield this._formatSSE("agent_start", { agent: "planner", label: "Planner Agent", message: "Creating your personalized shopping plan..." });
      yield this._formatSSE("agent_done", { agent: "planner", label: "Planner Agent", result: plan });

      let allSelected = [];
      const categories = plan.categories || [];

      for (const catPlan of categories) {
        const cat = catPlan.name;
        const budget = catPlan.budget;
        const mustHave = catPlan.must_have || [];
        const niceToHave = catPlan.nice_to_have || [];
        const maxItems = catPlan.max_items || 3;

        yield this._formatSSE("agent_start", { agent: `filter_${cat}`, label: `Filter Agent (${cat})`, message: `Filtering ${cat} products...` });
        const filtered = await filterAgent(cat, budget, this.catalog, this.preferences);
        yield this._formatSSE("agent_done", { agent: `filter_${cat}`, label: `Filter Agent (${cat})`, result: { count: filtered.length, category: cat } });

        yield this._formatSSE("agent_start", { agent: `ranker_${cat}`, label: `Ranker Agent (${cat})`, message: `Ranking ${cat} by priority...` });
        const ranked = await rankerAgent(cat, filtered, mustHave, niceToHave, this.preferences);
        yield this._formatSSE("agent_done", { agent: `ranker_${cat}`, label: `Ranker Agent (${cat})`, result: { count: ranked.length, category: cat } });

        yield this._formatSSE("agent_start", { agent: `selector_${cat}`, label: `Selector Agent (${cat})`, message: `Selecting best ${cat} items...` });
        const selected = await selectorAgent(cat, ranked, budget, maxItems, this.preferences);

        // Emit EACH selected item as a progressive "item_found" event so UI fills in live
        for (const product of selected) {
          this.runningItems.push(product);
          this.runningTotal += product.price;
          yield this._formatSSE("item_found", {
            item: product,
            category: cat,
            running_total: this.runningTotal,
            running_count: this.runningItems.length,
            budget_total: goal.budget_total || 0,
          });
          // Small visual delay so user sees items appear one by one
          await new Promise(r => setTimeout(r, 140));
        }

        yield this._formatSSE("agent_done", {
          agent: `selector_${cat}`,
          label: `Selector Agent (${cat})`,
          result: { selected: selected.map(p => p.id), items: selected, category: cat }
        });

        allSelected.push(...selected);
      }

      yield this._formatSSE("agent_start", { agent: "review", label: "Review Trust Agent", message: "Checking review authenticity..." });
      const trusted = await reviewAgent(allSelected, this.preferences);
      // Emit trust updates so UI can add trust badges as reviews clear
      for (const tItem of trusted) {
        yield this._formatSSE("item_trusted", {
          product_id: tItem.id,
          trust_score: tItem.trust_score,
          trust_reason: tItem.trust_reason,
        });
      }
      yield this._formatSSE("agent_done", { agent: "review", label: "Review Trust Agent", result: { assessed: trusted.length } });

      yield this._formatSSE("agent_start", { agent: "recommend", label: "Recommendation Agent", message: "Building your optimized cart..." });
      const cartRec = await recommendAgent(trusted, goal, this.preferences);
      const recItems = cartRec.items || cartRec.cart || [];
      // Emit recommendation reasoning for each cart item progressively
      for (const cartItem of recItems) {
        yield this._formatSSE("item_reasoned", {
          product_id: cartItem.id,
          reason: cartItem.reason,
          quantity: cartItem.quantity || 1,
        });
        await new Promise(r => setTimeout(r, 80));
      }
      yield this._formatSSE("agent_done", { agent: "recommend", label: "Recommendation Agent", result: cartRec });

      yield this._formatSSE("agent_start", { agent: "checkout", label: "Checkout Agent", message: "Finalizing your cart..." });
      // Pass enriched cart items containing reasoning and trust scores to checkoutAgent
      const checkout = await checkoutAgent(recItems.length > 0 ? recItems : this.runningItems, goal.budget_total);
      
      const { updateContext } = await import('./conversationContext.js');
      updateContext(this.conversationId, {
        lastIntent: route.intent || 'shopping',
        lastQuery: query,
        lastCategories: expectedCats,
        lastSubcategory: null,
        lastBudget: goal.budget_total,
        lastSearchCriteria: { categories: expectedCats, budget: goal.budget_total },
        lastProductIds: (checkout.items || []).map(i => i.id).slice(0, 10),
        lastDisplayedProductIds: (checkout.items || []).map(i => i.id).slice(0, 10),
        lastProducts: (checkout.items || []).map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          rating: i.rating || 4.0,
          reviews: i.reviews || 0,
          brand: i.brand || 'Unknown',
          tags: i.tags || [],
          description: i.description || ''
        })).slice(0, 10),
        lastRecommendationSource: 'deterministic',
        lastResponse: checkout.summary
      });

      
      yield this._formatSSE("agent_done", { agent: "checkout", label: "Checkout Agent", result: { total: checkout.total, items: (checkout.items || []).length } });

      // After a successful plan, log "view" signal on every picked item so the learner adapts
      try {
        for (const item of (checkout.items || [])) {
          const product = getProductById(item.id);
          if (product) {
            await this.preferences.recordFeedback({
              product,
              feedback_type: "view",
              session_id: this.sessionId || undefined,
              catalog: this.catalog,
            });
          }
        }
      } catch (err) {
        console.warn("Failed to record view feedback:", err.message);
      }
      let dbGoalId = null;
      let dbPlanId = null;
      if (this.userId) {
        try {
          const dbResult = await prisma.$transaction(async (tx) => {
            const dbGoal = await tx.shoppingGoal.create({
              data: {
                user_id: this.userId,
                query: encryptMessage(query),
                budget: goal.budget_total || 0,
                status: "completed"
              }
            });

            const dbPlan = await tx.shoppingPlan.create({
              data: {
                goal_id: dbGoal.id,
                name: goal.goal_summary || "My Shopping Plan",
                total_budget: checkout.total || 0,
                is_saved: true
              }
            });

            const itemsToInsert = (checkout.items || []).map(item => ({
              plan_id: dbPlan.id,
              product_id: String(item.id),
              name: item.name,
              category: item.category,
              price: item.price,
              quantity: item.quantity || 1,
              trust_score: item.trust_score ?? 0.85,
              reason: (item.reason && item.reason.trim())
                ? item.reason.trim()
                : `Selected by Sakhi as a top-rated ${item.category} pick offering high quality and value within budget.`
            }));

            if (itemsToInsert.length > 0) {
              await tx.cartItem.createMany({
                data: itemsToInsert
              });
            }
            
            return { goalId: dbGoal.id, planId: dbPlan.id };
          });

          dbGoalId = dbResult.goalId;
          dbPlanId = dbResult.planId;

          // Also log save signal since saved to DB for user
          for (const item of (checkout.items || [])) {
            const product = getProductById(item.id);
            if (product) {
              await this.preferences.recordFeedback({
                product,
                feedback_type: "save",
                goal_id: dbGoalId,
                session_id: this.sessionId || undefined,
                catalog: this.catalog,
              });
            }
          }
        } catch (dbErr) {
          console.error(`Failed to save to database: ${dbErr}`);
        }
      }

      const personalization = {
        used_profile: !!this.userId,
        signals_used: prefInsights.signals,
        insights: this.preferences.getInsights(),
      };

      await this._logActivity({
        event_type: 'shopping_completed',
        intent: route.intent || 'shopping',
        request_id: requestId,
        duration_ms: Date.now() - startTime,
        success: true,
        metadata: JSON.stringify({
          plan_id: dbPlanId,
          goal_id: dbGoalId,
          category_count: (checkout.items || []).reduce((acc, i) => acc.add(i.category), new Set()).size,
          products_selected: (checkout.items || []).length,
          cart_total: checkout.total || 0,
          ai_used: true,
          ai_calls: 1,
          encrypted_assistant_message: encryptMessage(checkout.summary || "Here is your personalized shopping plan based on your request.")
        })
      });

      yield this._formatSSE("complete", { checkout, goal, personalization });
    } catch (error) {
      await this._logActivity({
        event_type: 'shopping_failed',
        request_id: requestId,
        duration_ms: Date.now() - startTime,
        success: false,
        metadata: JSON.stringify({ error: error.message })
      });
      yield this._formatSSE("error", { message: error.message });
    }
  }
}
