import json
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import (
    goal_agent, planner_agent, filter_agent, ranker_agent,
    selector_agent, review_agent, recommend_agent, checkout_agent
)

app = FastAPI(title="Meesho Sakhi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

# Load catalog once at startup
with (BASE_DIR / "catalog.json").open("r", encoding="utf-8") as f:
    CATALOG = json.load(f)

class ShoppingRequest(BaseModel):
    query: str

def sse_event(event_type: str, data: dict) -> str:
    return f"data: {json.dumps({'type': event_type, **data})}\n\n"

async def run_pipeline(query: str):
    try:
        # Agent 1: Goal Understanding
        yield sse_event("agent_start", {"agent": "goal", "label": "Goal Agent", "message": "Understanding your shopping goal..."})
        goal = goal_agent(query)
        yield sse_event("agent_done", {"agent": "goal", "label": "Goal Agent", "result": goal})

        # Agent 2: Planning
        yield sse_event("agent_start", {"agent": "planner", "label": "Planner Agent", "message": "Creating your personalized shopping plan..."})
        plan = planner_agent(goal)
        yield sse_event("agent_done", {"agent": "planner", "label": "Planner Agent", "result": plan})

        # Agents 3-5 per category: Filter → Rank → Select
        all_selected = []
        for cat_plan in plan.get("categories", []):
            cat = cat_plan["name"]
            budget = cat_plan["budget"]
            must_have = cat_plan.get("must_have", [])
            nice_to_have = cat_plan.get("nice_to_have", [])
            max_items = cat_plan.get("max_items", 3)

            # Filter
            yield sse_event("agent_start", {"agent": f"filter_{cat}", "label": f"Filter Agent ({cat})", "message": f"Filtering {cat} products within ₹{budget}..."})
            filtered = filter_agent(cat, budget, CATALOG)
            yield sse_event("agent_done", {"agent": f"filter_{cat}", "label": f"Filter Agent ({cat})", "result": {"count": len(filtered), "category": cat}})

            # Rank
            yield sse_event("agent_start", {"agent": f"ranker_{cat}", "label": f"Ranker Agent ({cat})", "message": f"Ranking {cat} by priority and trust..."})
            ranked = ranker_agent(cat, filtered, must_have, nice_to_have)
            yield sse_event("agent_done", {"agent": f"ranker_{cat}", "label": f"Ranker Agent ({cat})", "result": {"count": len(ranked), "category": cat}})

            # Select
            yield sse_event("agent_start", {"agent": f"selector_{cat}", "label": f"Selector Agent ({cat})", "message": f"Selecting best {cat} items for your budget..."})
            selected = selector_agent(cat, ranked, budget, max_items)
            yield sse_event("agent_done", {"agent": f"selector_{cat}", "label": f"Selector Agent ({cat})", "result": {"selected": [p["id"] for p in selected]}})

            all_selected.extend(selected)

        # Agent 6: Review Trust
        yield sse_event("agent_start", {"agent": "review", "label": "Review Trust Agent", "message": "Checking review authenticity and trust scores..."})
        trusted = review_agent(all_selected)
        yield sse_event("agent_done", {"agent": "review", "label": "Review Trust Agent", "result": {"assessed": len(trusted)}})

        # Agent 7: Final Recommendation
        yield sse_event("agent_start", {"agent": "recommend", "label": "Recommendation Agent", "message": "Building your optimized cart..."})
        cart_rec = recommend_agent(trusted, goal)
        yield sse_event("agent_done", {"agent": "recommend", "label": "Recommendation Agent", "result": cart_rec})

        # Agent 8: Checkout
        yield sse_event("agent_start", {"agent": "checkout", "label": "Checkout Agent", "message": "Finalizing your order summary..."})
        checkout = checkout_agent(cart_rec, CATALOG)
        yield sse_event("agent_done", {"agent": "checkout", "label": "Checkout Agent", "result": checkout})

        yield sse_event("complete", {"checkout": checkout, "goal": goal})

    except Exception as e:
        yield sse_event("error", {"message": str(e)})

@app.post("/shop")
async def shop(request: ShoppingRequest):
    return StreamingResponse(
        run_pipeline(request.query),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@app.get("/health")
async def health():
    return {"status": "ok", "catalog_size": len(CATALOG)}
