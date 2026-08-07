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


# ─── Budget Parsing ──────────────────────────────────────────────────────────
def _parse_budget(text: str) -> int:
    """Extract budget from natural language. Handles ₹15,000 / 15k / 15000 / Rs 15000 etc."""
    text = text.lower().replace("₹", "").replace("rs", "").replace("rs.", "").replace("inr", "")
    
    # Match patterns like "15,000" or "1,50,000" (Indian format) or "15000"
    # Also match "15k" or "15K"
    
    # First try: numbers with commas like 15,000 or 1,50,000
    comma_matches = re.findall(r'(\d{1,3}(?:,\d{2,3})*)', text)
    if comma_matches:
        # Take the largest number found
        parsed = []
        for m in comma_matches:
            try:
                parsed.append(int(m.replace(",", "")))
            except ValueError:
                pass
        if parsed:
            # Return the one that looks most like a budget (typically > 100)
            budgets = [p for p in parsed if p >= 100]
            if budgets:
                return max(budgets)
    
    # Second try: "15k" or "20K" style
    k_matches = re.findall(r'(\d+)\s*k\b', text)
    if k_matches:
        return int(k_matches[-1]) * 1000
    
    # Third try: plain large numbers like 15000, 8000
    plain_matches = re.findall(r'\d+', text)
    if plain_matches:
        candidates = [int(n) for n in plain_matches if int(n) >= 100]
        if candidates:
            return max(candidates)
    
    # Default budget
    return 12000


# ─── Category Detection ─────────────────────────────────────────────────────
# Maps keywords to relevant catalog categories with priority weights
QUERY_CATEGORY_MAP = {
    # Room / Hostel setup
    "hostel":       {"bedding": 0.30, "study": 0.25, "kitchen": 0.15, "storage": 0.12, "electronics": 0.10, "hygiene": 0.08},
    "room":         {"bedding": 0.30, "study": 0.20, "kitchen": 0.15, "storage": 0.15, "electronics": 0.10, "hygiene": 0.10},
    "pg":           {"bedding": 0.30, "study": 0.20, "kitchen": 0.15, "storage": 0.15, "electronics": 0.10, "hygiene": 0.10},
    "dorm":         {"bedding": 0.30, "study": 0.25, "kitchen": 0.15, "storage": 0.12, "electronics": 0.10, "hygiene": 0.08},
    "flat":         {"bedding": 0.25, "kitchen": 0.25, "storage": 0.15, "electronics": 0.15, "hygiene": 0.10, "study": 0.10},
    "apartment":    {"bedding": 0.25, "kitchen": 0.25, "storage": 0.15, "electronics": 0.15, "hygiene": 0.10, "study": 0.10},
    "bachelor":     {"bedding": 0.25, "kitchen": 0.20, "study": 0.15, "storage": 0.15, "electronics": 0.15, "hygiene": 0.10},
    
    # Study focused
    "study":        {"study": 0.50, "electronics": 0.30, "storage": 0.20},
    "student":      {"study": 0.35, "bedding": 0.25, "electronics": 0.20, "kitchen": 0.10, "hygiene": 0.05, "storage": 0.05},
    "engineering":  {"study": 0.40, "electronics": 0.30, "bedding": 0.20, "storage": 0.10},
    "college":      {"study": 0.30, "bedding": 0.25, "electronics": 0.20, "kitchen": 0.10, "storage": 0.10, "hygiene": 0.05},
    "exam":         {"study": 0.60, "electronics": 0.25, "kitchen": 0.15},
    "desk":         {"study": 0.60, "electronics": 0.25, "storage": 0.15},
    "laptop":       {"electronics": 0.50, "study": 0.30, "storage": 0.20},
    "work from home":{"study": 0.35, "electronics": 0.35, "kitchen": 0.15, "storage": 0.15},
    "wfh":          {"study": 0.35, "electronics": 0.35, "kitchen": 0.15, "storage": 0.15},
    
    # Kitchen focused
    "kitchen":      {"kitchen": 0.65, "storage": 0.20, "hygiene": 0.15},
    "cook":         {"kitchen": 0.65, "storage": 0.20, "hygiene": 0.15},
    "cooking":      {"kitchen": 0.65, "storage": 0.20, "hygiene": 0.15},
    "food":         {"kitchen": 0.60, "storage": 0.25, "hygiene": 0.15},
    "tiffin":       {"kitchen": 0.70, "storage": 0.30},
    "meal":         {"kitchen": 0.70, "storage": 0.15, "hygiene": 0.15},
    
    # Bedroom / Sleep focused
    "bed":          {"bedding": 0.70, "storage": 0.15, "hygiene": 0.15},
    "sleep":        {"bedding": 0.70, "electronics": 0.15, "hygiene": 0.15},
    "mattress":     {"bedding": 0.80, "hygiene": 0.20},
    "pillow":       {"bedding": 0.80, "hygiene": 0.20},
    "blanket":      {"bedding": 0.80, "hygiene": 0.20},
    
    # Electronics focused
    "gadget":       {"electronics": 0.60, "study": 0.25, "storage": 0.15},
    "electronic":   {"electronics": 0.60, "study": 0.25, "storage": 0.15},
    "tech":         {"electronics": 0.60, "study": 0.25, "storage": 0.15},
    "charger":      {"electronics": 0.80, "study": 0.20},
    "speaker":      {"electronics": 0.80, "study": 0.20},
    "earphone":     {"electronics": 0.80, "study": 0.20},
    "headphone":    {"electronics": 0.80, "study": 0.20},
    
    # Storage / Organization
    "organiz":      {"storage": 0.60, "study": 0.20, "hygiene": 0.20},
    "storage":      {"storage": 0.60, "kitchen": 0.20, "hygiene": 0.20},
    "clean":        {"hygiene": 0.60, "kitchen": 0.20, "storage": 0.20},
    "laundry":      {"hygiene": 0.60, "storage": 0.25, "kitchen": 0.15},
    "bathroom":     {"hygiene": 0.70, "storage": 0.30},
    "towel":        {"hygiene": 0.70, "storage": 0.30},
    
    # Life events
    "moving":       {"bedding": 0.25, "kitchen": 0.25, "storage": 0.20, "electronics": 0.15, "hygiene": 0.15},
    "shifting":     {"bedding": 0.25, "kitchen": 0.25, "storage": 0.20, "electronics": 0.15, "hygiene": 0.15},
    "new home":     {"bedding": 0.20, "kitchen": 0.25, "storage": 0.20, "electronics": 0.15, "hygiene": 0.10, "study": 0.10},
    "first time":   {"bedding": 0.25, "kitchen": 0.20, "study": 0.15, "storage": 0.15, "electronics": 0.15, "hygiene": 0.10},
    "essentials":   {"bedding": 0.20, "kitchen": 0.20, "hygiene": 0.20, "storage": 0.15, "electronics": 0.15, "study": 0.10},
    "basics":       {"bedding": 0.20, "kitchen": 0.20, "hygiene": 0.20, "storage": 0.15, "electronics": 0.15, "study": 0.10},
    "everything":   {"bedding": 0.20, "kitchen": 0.20, "study": 0.15, "storage": 0.15, "electronics": 0.15, "hygiene": 0.15},
    "complete":     {"bedding": 0.20, "kitchen": 0.20, "study": 0.15, "storage": 0.15, "electronics": 0.15, "hygiene": 0.15},
    "setup":        {"bedding": 0.20, "kitchen": 0.20, "study": 0.15, "storage": 0.15, "electronics": 0.15, "hygiene": 0.15},
    
    # Gender-specific
    "girl":         {"bedding": 0.25, "hygiene": 0.25, "storage": 0.20, "kitchen": 0.15, "study": 0.10, "electronics": 0.05},
    "boy":          {"study": 0.25, "electronics": 0.25, "bedding": 0.20, "kitchen": 0.15, "storage": 0.10, "hygiene": 0.05},
    "women":        {"bedding": 0.25, "hygiene": 0.25, "storage": 0.20, "kitchen": 0.15, "study": 0.10, "electronics": 0.05},
    "men":          {"study": 0.25, "electronics": 0.25, "bedding": 0.20, "kitchen": 0.15, "storage": 0.10, "hygiene": 0.05},
}

def _detect_categories(text: str) -> dict:
    """Detect relevant categories and their budget weights from the query."""
    text_lower = text.lower()
    
    # Accumulate weights from all matching keywords
    combined = {}
    matches = 0
    
    for keyword, weights in QUERY_CATEGORY_MAP.items():
        if keyword in text_lower:
            matches += 1
            for cat, weight in weights.items():
                combined[cat] = combined.get(cat, 0) + weight
    
    if not combined or matches == 0:
        # Default: balanced across all categories
        combined = {
            "bedding": 0.25, "study": 0.20, "kitchen": 0.20,
            "storage": 0.12, "electronics": 0.13, "hygiene": 0.10
        }
    
    # Normalize weights to sum to 1.0
    total_weight = sum(combined.values())
    if total_weight > 0:
        combined = {k: v / total_weight for k, v in combined.items()}
    
    return combined


def goal_agent(raw_input: str) -> dict:
    """Parse and clarify the user's shopping goal."""
    budget = _parse_budget(raw_input)
    category_weights = _detect_categories(raw_input)
    
    # Allocate budget per category based on detected weights
    budget_per_category = {}
    for cat, weight in category_weights.items():
        alloc = int(budget * weight)
        if alloc >= 50:  # Only include categories with meaningful budget
            budget_per_category[cat] = alloc

    # Build a smart summary
    top_cats = sorted(category_weights, key=category_weights.get, reverse=True)[:3]
    cat_names = ", ".join(top_cats)
    
    fallback = {
        "goal_summary": f"{raw_input[:80]}",
        "budget_total": budget,
        "budget_per_category": budget_per_category,
        "priority": "balanced",
        "context": f"User wants: {raw_input}. Focus areas: {cat_names}."
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
    budget_map = goal.get("budget_per_category", {})
    
    for name, budget in budget_map.items():
        if budget <= 0:
            continue
        # Smarter max_items: at least 2 items, scale with budget
        max_items = max(2, min(5, budget // 800))
        categories.append({
            "name": name,
            "budget": budget,
            "must_have": [f"top-rated {name} essentials"],
            "nice_to_have": [f"comfort upgrades for {name}"],
            "max_items": max_items
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
    top = affordable[:8]

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
        # Boost items with relevant tags
        boost_tags = ["hostel", "study", "stainless", "LED", "organizer", "foldable", 
                      "portable", "ergonomic", "essential", "quick-dry", "insulated"]
        if any(tag in product.get("tags", []) for tag in boost_tags):
            score += 3
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
        
        if trust_score >= 0.9:
            reason = "Exceptional ratings with high review volume — very trustworthy"
        elif trust_score >= 0.8:
            reason = "Strong rating and solid review count"
        elif trust_score >= 0.7:
            reason = "Good value pick with decent reviews"
        else:
            reason = "Budget-friendly option, fewer reviews but acceptable quality"
        
        item["trust_score"] = trust_score
        item["trust_reason"] = reason
    return selected_items

def recommend_agent(all_selected: list, goal: dict) -> dict:
    """Final recommendation: build the cart with reasoning."""
    cart = []
    total = 0
    goal_summary = goal.get("goal_summary", "your shopping goal")
    
    for item in all_selected[:12]:  # Allow up to 12 items
        reason = f"Best {item['category']} pick for: {goal_summary}"
        cart.append({"id": item["id"], "quantity": 1, "reason": reason})
        total += item["price"]

    budget = goal.get("budget_total", 0)
    saved = budget - total if budget > total else 0
    
    if saved > 0:
        savings_tip = f"🎉 Great news! You saved ₹{saved:,} from your ₹{budget:,} budget. Consider adding extras or saving for later!"
    else:
        savings_tip = "Your cart is optimized to give you the best value within your budget."

    fallback = {
        "cart": cart,
        "total": total,
        "savings_tip": savings_tip,
        "summary": f"Sakhi curated {len(cart)} items across {len(set(i.get('category','') for i in all_selected[:12]))} categories, optimized for quality and budget."
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
