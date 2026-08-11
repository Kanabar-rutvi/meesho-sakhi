import json
from typing import AsyncGenerator
from agents import (
    goal_agent, planner_agent, filter_agent, ranker_agent,
    selector_agent, review_agent, recommend_agent, checkout_agent
)
import models

class AgentOrchestrator:
    def __init__(self, catalog, db_session=None, user_id=None):
        self.catalog = catalog
        self.db_session = db_session
        self.user_id = user_id

    def _sse_event(self, event_type: str, data: dict) -> str:
        return f"data: {json.dumps({'type': event_type, **data})}\n\n"

    async def execute_full_plan(self, query: str) -> AsyncGenerator[str, None]:
        """
        Executes the full 8-agent pipeline, yielding SSE events.
        """
        try:
            # 1. Goal Agent
            yield self._sse_event("agent_start", {"agent": "goal", "label": "Goal Agent", "message": "Understanding your shopping goal..."})
            goal = goal_agent(query)
            yield self._sse_event("agent_done", {"agent": "goal", "label": "Goal Agent", "result": goal})

            # 2. Planner Agent
            yield self._sse_event("agent_start", {"agent": "planner", "label": "Planner Agent", "message": "Creating your personalized shopping plan..."})
            plan = planner_agent(goal)
            yield self._sse_event("agent_done", {"agent": "planner", "label": "Planner Agent", "result": plan})

            all_selected = []
            
            # 3, 4, 5. Category-wise processing
            for cat_plan in plan.get("categories", []):
                cat = cat_plan["name"]
                budget = cat_plan["budget"]
                must_have = cat_plan.get("must_have", [])
                nice_to_have = cat_plan.get("nice_to_have", [])
                max_items = cat_plan.get("max_items", 3)

                yield self._sse_event("agent_start", {"agent": f"filter_{cat}", "label": f"Filter Agent ({cat})", "message": f"Filtering {cat} products..."})
                filtered = filter_agent(cat, budget, self.catalog)
                yield self._sse_event("agent_done", {"agent": f"filter_{cat}", "label": f"Filter Agent ({cat})", "result": {"count": len(filtered), "category": cat}})

                yield self._sse_event("agent_start", {"agent": f"ranker_{cat}", "label": f"Ranker Agent ({cat})", "message": f"Ranking {cat} by priority..."})
                ranked = ranker_agent(cat, filtered, must_have, nice_to_have)
                yield self._sse_event("agent_done", {"agent": f"ranker_{cat}", "label": f"Ranker Agent ({cat})", "result": {"count": len(ranked), "category": cat}})

                yield self._sse_event("agent_start", {"agent": f"selector_{cat}", "label": f"Selector Agent ({cat})", "message": f"Selecting best {cat} items..."})
                selected = selector_agent(cat, ranked, budget, max_items)
                yield self._sse_event("agent_done", {"agent": f"selector_{cat}", "label": f"Selector Agent ({cat})", "result": {"selected": [p["id"] for p in selected]}})

                all_selected.extend(selected)

            # 6. Review Trust
            yield self._sse_event("agent_start", {"agent": "review", "label": "Review Trust Agent", "message": "Checking review authenticity..."})
            trusted = review_agent(all_selected)
            yield self._sse_event("agent_done", {"agent": "review", "label": "Review Trust Agent", "result": {"assessed": len(trusted)}})

            # 7. Recommend
            yield self._sse_event("agent_start", {"agent": "recommend", "label": "Recommendation Agent", "message": "Building your optimized cart..."})
            cart_rec = recommend_agent(trusted, goal)
            yield self._sse_event("agent_done", {"agent": "recommend", "label": "Recommendation Agent", "result": cart_rec})

            # 8. Checkout
            yield self._sse_event("agent_start", {"agent": "checkout", "label": "Checkout Agent", "message": "Finalizing your order summary..."})
            checkout = checkout_agent(cart_rec, self.catalog)
            yield self._sse_event("agent_done", {"agent": "checkout", "label": "Checkout Agent", "result": checkout})

            if self.db_session:
                try:
                    db_goal = models.ShoppingGoal(
                        user_id=self.user_id,
                        query=query,
                        budget=goal.get("budget_total", 0),
                        status="completed"
                    )
                    self.db_session.add(db_goal)
                    self.db_session.commit()
                    self.db_session.refresh(db_goal)

                    db_plan = models.ShoppingPlan(
                        goal_id=db_goal.id,
                        name=goal.get("goal_summary", "My Shopping Plan"),
                        total_budget=checkout.get("total", 0),
                        is_saved=True
                    )
                    self.db_session.add(db_plan)
                    self.db_session.commit()
                    self.db_session.refresh(db_plan)

                    for item in checkout.get("items", []):
                        db_item = models.CartItem(
                            plan_id=db_plan.id,
                            product_id=str(item.get("id")),
                            name=item.get("name"),
                            category=item.get("category"),
                            price=item.get("price"),
                            quantity=item.get("quantity", 1),
                            trust_score=item.get("trust_score", 0.0),
                            reason=item.get("reason", "")
                        )
                        self.db_session.add(db_item)
                    self.db_session.commit()
                except Exception as db_err:
                    self.db_session.rollback()
                    print(f"Failed to save to database: {db_err}")

            yield self._sse_event("complete", {"checkout": checkout, "goal": goal})

        except Exception as e:
            yield self._sse_event("error", {"message": str(e)})

    async def refine_plan(self, existing_checkout: dict, modification_query: str) -> AsyncGenerator[str, None]:
        """
        Handles natural language cart refinement without running the full pipeline.
        (Implementation for Phase 9)
        """
        # Stub for Phase 9
        pass
