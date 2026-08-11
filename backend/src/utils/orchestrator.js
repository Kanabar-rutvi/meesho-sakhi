import {
  goalAgent, plannerAgent, filterAgent, rankerAgent,
  selectorAgent, reviewAgent, recommendAgent, checkoutAgent
} from './agents.js';
import prisma from './db.js';
import { PreferenceEngine } from './preferenceEngine.js';

export class AgentOrchestrator {
  constructor(catalog, userId = null, sessionId = null) {
    this.catalog = catalog;
    this.userId = userId;
    this.sessionId = sessionId;
    this.preferences = new PreferenceEngine(userId);
    this.runningTotal = 0;
    this.runningItems = [];
    this.goalData = null;
  }

  _formatSSE(type, data) {
    return `data: ${JSON.stringify({ type, ...data })}\n\n`;
  }

  async *executeFullPlan(query) {
    try {
      await this.preferences.load();
      const prefInsights = this.preferences.getInsights();

      yield this._formatSSE("agent_start", { agent: "goal", label: "Goal Agent", message: "Understanding your shopping goal..." });
      const goal = await goalAgent(query, this.preferences);
      this.goalData = goal;
      yield this._formatSSE("agent_done", { agent: "goal", label: "Goal Agent", result: goal });

      // Let frontend know categories + total expected so it can pre-render skeleton groups
      const expectedCats = Object.keys(goal.budget_per_category || {});
      yield this._formatSSE("cart_expected", {
        categories: expectedCats,
        budget_total: goal.budget_total || 0,
      });

      yield this._formatSSE("agent_start", { agent: "planner", label: "Planner Agent", message: "Creating your personalized shopping plan..." });
      const plan = await plannerAgent(goal, this.preferences);
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
      // Emit recommendation reasoning for each cart item progressively
      for (const cartItem of (cartRec.cart || [])) {
        yield this._formatSSE("item_reasoned", {
          product_id: cartItem.id,
          reason: cartItem.reason,
          quantity: cartItem.quantity || 1,
        });
        await new Promise(r => setTimeout(r, 80));
      }
      yield this._formatSSE("agent_done", { agent: "recommend", label: "Recommendation Agent", result: cartRec });

      yield this._formatSSE("agent_start", { agent: "checkout", label: "Checkout Agent", message: "Finalizing your order summary..." });
      const checkout = await checkoutAgent(cartRec, this.catalog);
      yield this._formatSSE("agent_done", { agent: "checkout", label: "Checkout Agent", result: checkout });

      // After a successful plan, log "view" signal on every picked item so the learner adapts
      try {
        for (const item of (checkout.items || [])) {
          const product = this.catalog.find(p => p.id === item.id);
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

      let goalId = null;
      if (this.userId) {
        try {
          const dbGoal = await prisma.shoppingGoal.create({
            data: {
              user_id: this.userId,
              query: query,
              budget: goal.budget_total || 0,
              status: "completed"
            }
          });
          goalId = dbGoal.id;

          const dbPlan = await prisma.shoppingPlan.create({
            data: {
              goal_id: dbGoal.id,
              name: goal.goal_summary || "My Shopping Plan",
              total_budget: checkout.total || 0,
              is_saved: true
            }
          });

          for (const item of (checkout.items || [])) {
            await prisma.cartItem.create({
              data: {
                plan_id: dbPlan.id,
                product_id: String(item.id),
                name: item.name,
                category: item.category,
                price: item.price,
                quantity: item.quantity || 1,
                trust_score: item.trust_score || 0.0,
                reason: item.reason || ""
              }
            });
          }

          // Also log save signal since saved to DB for user
          for (const item of (checkout.items || [])) {
            const product = this.catalog.find(p => p.id === item.id);
            if (product) {
              await this.preferences.recordFeedback({
                product,
                feedback_type: "save",
                goal_id: dbGoal.id,
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

      yield this._formatSSE("complete", { checkout, goal, personalization });
    } catch (error) {
      yield this._formatSSE("error", { message: error.message });
    }
  }
}
