import { useState, useCallback } from "react";

const getApiUrl = () => {
  try {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, "");
    }
    return "";
  } catch (error) {
    return null;
  }
};

const API_BASE_URL = getApiUrl();
console.log("[Meesho Sakhi] API Base URL:", API_BASE_URL === null ? "NULL (ERROR)" : (API_BASE_URL === "" ? "(relative / Vite proxy)" : API_BASE_URL));

export function usePipeline() {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [agents, setAgents] = useState({});      // agentKey -> {state, result, label, icon}
  const [agentOrder, setAgentOrder] = useState([]);
  const [checkout, setCheckout] = useState(null);
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState(null);

  // Progressive streaming state (live-updating list)
  const [streamingExpected, setStreamingExpected] = useState(null); // {categories, budget_total}
  const [streamingItems, setStreamingItems] = useState([]);         // items found so far (real data)
  const [streamingTotal, setStreamingTotal] = useState(0);          // running price total
  const [streamingCount, setStreamingCount] = useState(0);          // running item count
  const [trustScores, setTrustScores] = useState({});               // product_id -> {trust_score, trust_reason}
  const [itemReasons, setItemReasons] = useState({});               // product_id -> {reason, quantity}

  const run = useCallback(async (query) => {
    setStatus("running");
    setAgents({});
    setAgentOrder([]);
    setCheckout(null);
    setGoal(null);
    setError(null);
    setStreamingExpected(null);
    setStreamingItems([]);
    setStreamingTotal(0);
    setStreamingCount(0);
    setTrustScores({});
    setItemReasons({});

    try {
      if (API_BASE_URL === null) {
        throw new Error(
          "Backend API URL is not configured. " +
          "For production, set VITE_API_URL environment variable and rebuild. " +
          "For local development, make sure the backend is running on http://localhost:8000"
        );
      }

      const apiUrl = API_BASE_URL ? `${API_BASE_URL}/shop` : "/shop";
      console.log('[Meesho Sakhi] Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Meesho Sakhi] API Error Response:', response.status, errorText);
        
        // Provide helpful error messages
        if (response.status === 404) {
          const displayUrl = API_BASE_URL || "(Vite proxy / relative)";
          throw new Error(
            `Backend endpoint not found (404). ` +
            `Verify VITE_API_URL is correct: ${displayUrl} ` +
            `and the backend is running on port 8000.`
          );
        } else if (response.status === 500) {
          throw new Error(`Backend server error: ${errorText || "Internal Server Error"}`);
        } else {
          throw new Error(`Server error: ${response.status}${errorText ? ` - ${errorText}` : ""}`);
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim().startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(line.indexOf("data: ") + 6));
            handleEvent(event);
          } catch (e) {
            console.warn("[Meesho Sakhi] Failed to parse SSE event:", e);
          }
        }
      }
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }, []);

  function handleEvent(event) {
    const { type, agent, label, message, result } = event;

    if (type === "agent_start") {
      setAgentOrder(prev => prev.includes(agent) ? prev : [...prev, agent]);
      setAgents(prev => ({
        ...prev,
        [agent]: { state: "running", label, message, result: null }
      }));
    } else if (type === "agent_done") {
      setAgents(prev => ({
        ...prev,
        [agent]: { ...prev[agent], state: "done", result }
      }));
    } else if (type === "cart_expected") {
      // Frontend can pre-render skeleton sections for each category
      setStreamingExpected({
        categories: event.categories || [],
        budget_total: event.budget_total || 0,
      });
    } else if (type === "item_found") {
      // An item has been selected — add to the live list IMMEDIATELY
      setStreamingItems(prev => {
        if (prev.some(p => p.id === event.item.id)) return prev;
        return [...prev, event.item];
      });
      setStreamingTotal(event.running_total || 0);
      setStreamingCount(event.running_count || 0);
    } else if (type === "item_trusted") {
      // Review agent finished vetting this product — add trust badge
      setTrustScores(prev => ({
        ...prev,
        [event.product_id]: {
          trust_score: event.trust_score,
          trust_reason: event.trust_reason,
        }
      }));
    } else if (type === "item_reasoned") {
      // Recommend agent added a "why Sakhi picked this" reason
      setItemReasons(prev => ({
        ...prev,
        [event.product_id]: {
          reason: event.reason,
          quantity: event.quantity || 1,
        }
      }));
    } else if (type === "complete") {
      setCheckout(event.checkout);
      setGoal(event.goal);
      setStatus("done");
    } else if (type === "error") {
      setError(event.message);
      setStatus("error");
    }
  }

  const reset = useCallback(() => {
    setStatus("idle");
    setAgents({});
    setAgentOrder([]);
    setCheckout(null);
    setGoal(null);
    setError(null);
    setStreamingExpected(null);
    setStreamingItems([]);
    setStreamingTotal(0);
    setStreamingCount(0);
    setTrustScores({});
    setItemReasons({});
  }, []);

  return {
    status, agents, agentOrder, checkout, goal, error, run, reset,
    // Streaming state (for progressive list rendering)
    streamingExpected, streamingItems, streamingTotal, streamingCount,
    trustScores, itemReasons,
  };
}
