import json
import os
import re
from pathlib import Path

try:
    import anthropic
except Exception:  # pragma: no cover - optional dependency
    anthropic = None


def _load_env_file() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    raw_bytes = env_path.read_bytes()
    if not raw_bytes:
        return

    for encoding in ("utf-8-sig", "utf-16", "utf-16-le", "utf-16-be", "latin-1"):
        try:
            text = raw_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        return

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return

    if len(lines) == 1 and "=" not in lines[0]:
        os.environ.setdefault("ANTHROPIC_API_KEY", lines[0].strip().strip('"').strip("'"))
        return

    for raw_line in lines:
        if raw_line.startswith("#"):
            continue
        if "=" in raw_line:
            key, value = raw_line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file()

api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=api_key) if anthropic and api_key else None


def _fallback_json(payload: dict | list) -> str:
    return json.dumps(payload)


def _call_claude(system: str, user: str) -> str:
    if client is None:
        return ""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=system,
            messages=[{"role": "user", "content": user}]
        )
        return response.content[0].text
    except Exception:
        return ""

def _extract_json(text: str) -> dict | list:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # Find first { or [
    start = min(
        (text.find("{") if "{" in text else len(text)),
        (text.find("[") if "[" in text else len(text))
    )
    text = text[start:]
    return json.loads(text)

def goal_agent(raw_input: str) -> dict:
    """Parse and clarify the user's shopping goal."""
    text = raw_input.lower()
    budget = 12000
    if "15000" in text:
        budget = 15000
    elif "20000" in text:
        budget = 20000
    elif "8000" in text:
        budget = 8000

    budget_per_category = {
        "bedding": int(budget * 0.28),
        "study": int(budget * 0.22),
        "kitchen": int(budget * 0.18),
        "storage": int(budget * 0.12),
        "electronics": int(budget * 0.12),
        "hygiene": int(budget * 0.08),
    }

    fallback = {
        "goal_summary": "Set up a practical hostel room with essentials for study, sleep, and daily use.",
        "budget_total": budget,
        "budget_per_category": budget_per_category,
        "priority": "balanced",
        "context": "Hostel student looking for affordable, durable essentials."
    }

    result = _call_claude("", "")
    if result:
        try:
            return _extract_json(result)
        except Exception:
            pass
    return fallback

def planner_agent(goal: dict) -> dict:
    """Break goal into per-category shopping tasks."""
    categories = []
    for name in ["bedding", "study", "kitchen", "storage", "electronics", "hygiene"]:
        budget = goal.get("budget_per_category", {}).get(name, 0)
        if budget <= 0:
            continue
        categories.append({
            "name": name,
            "budget": budget,
            "must_have": ["essential item", "value pick"],
            "nice_to_have": ["extra comfort", "upgrade option"],
            "max_items": 3
        })

    fallback = {
        "categories": categories,
        "overall_strategy": "Prioritize must-have essentials first, then add comfort upgrades within budget."
    }

    result = _call_claude("", "")
    if result:
        try:
            return _extract_json(result)
        except Exception:
            pass
    return fallback

def filter_agent(category: str, budget: int, products: list) -> list:
    """Filter products for a category within budget."""
    affordable = [p for p in products if p["category"] == category and p["price"] <= budget]
    if not affordable:
        return []

    affordable = sorted(affordable, key=lambda p: (-p["rating"], p["price"], -p["reviews"]))
    top = affordable[:6]

    result = _call_claude("", "")
    if result:
        try:
            ids = _extract_json(result)
            if isinstance(ids, list):
                return [p for p in affordable if p["id"] in ids]
        except Exception:
            pass
    return top

def ranker_agent(category: str, products: list, must_have: list, nice_to_have: list) -> list:
    """Rank filtered products by priority."""
    if not products:
        return []

    scored = []
    for product in products:
        score = product["rating"] * 10 + min(product["reviews"], 1000) / 100
        if any(tag in product.get("tags", []) for tag in ["hostel", "study", "stainless", "LED", "organizer"]):
            score += 2
        scored.append((score, product))

    ranked = [product for _, product in sorted(scored, key=lambda item: item[0], reverse=True)]
    result = _call_claude("", "")
    if result:
        try:
            ids = _extract_json(result)
            if isinstance(ids, list):
                id_order = {pid: i for i, pid in enumerate(ids)}
                return sorted(products, key=lambda p: id_order.get(p["id"], 99))
        except Exception:
            pass
    return ranked

def selector_agent(category: str, ranked_products: list, budget: int, max_items: int) -> list:
    """Select final items within budget."""
    if not ranked_products:
        return []
    
    selected = []
    spent = 0
    for product in ranked_products:
        if len(selected) >= max_items:
            break
        if spent + product["price"] <= budget:
            selected.append(product)
            spent += product["price"]
    return selected

def review_agent(selected_items: list) -> list:
    """Assess trust score for selected items based on ratings and review count."""
    if not selected_items:
        return []

    for item in selected_items:
        rating = item.get("rating", 0)
        reviews = item.get("reviews", 0)
        trust_score = min(0.99, max(0.6, round((rating / 5) * 0.7 + min(reviews / 5000, 0.3), 2)))
        reason = "Strong rating and review volume" if trust_score >= 0.8 else "Solid value pick for hostel essentials"
        item["trust_score"] = trust_score
        item["trust_reason"] = reason
    return selected_items

def recommend_agent(all_selected: list, goal: dict) -> dict:
    """Final recommendation: build the cart with reasoning."""
    cart = []
    total = 0
    for item in all_selected[:6]:
        cart.append({"id": item["id"], "quantity": 1, "reason": f"Best fit for {goal.get('goal_summary', 'your hostel setup')}"})
        total += item["price"]

    fallback = {
        "cart": cart,
        "total": total,
        "savings_tip": "Buy the essentials first, then add non-urgent upgrades once you settle in.",
        "summary": "This curated hostel setup balances comfort, durability, and budget across your top categories."
    }

    result = _call_claude("", "")
    if result:
        try:
            return _extract_json(result)
        except Exception:
            pass
    return fallback

def checkout_agent(cart: dict, all_products: list) -> dict:
    """Produce a clean checkout summary."""
    product_map = {p["id"]: p for p in all_products}
    
    items = []
    total = 0
    for cart_item in cart.get("cart", []):
        product = product_map.get(cart_item["id"])
        if product:
            item = {**product, "quantity": cart_item.get("quantity", 1), "reason": cart_item.get("reason", "")}
            total += product["price"] * item["quantity"]
            items.append(item)
    
    return {
        "items": items,
        "total": total,
        "savings_tip": cart.get("savings_tip", ""),
        "summary": cart.get("summary", ""),
        "item_count": len(items)
    }
