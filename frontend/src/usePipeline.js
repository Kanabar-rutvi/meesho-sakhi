import { useState, useCallback } from "react";

// Get API URL from environment or use default based on current origin
const getApiUrl = () => {
  // 1. Check environment variable first (set during build)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // 2. For local development, use relative URL (proxied by Vite)
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }
  
  // 3. For production on same domain, try common API paths
  const origin = window.location.origin;
  
  // Try /api path first (common pattern)
  return origin; // Will use relative paths: /shop, /meesho, etc.
};

const API_BASE_URL = getApiUrl();

// Debug: Log the API URL being used
if (typeof window !== 'undefined') {
  console.log('[Meesho Sakhi] API Base URL:', API_BASE_URL);
}

export function usePipeline() {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [agents, setAgents] = useState({});      // agentKey -> {state, result, label, icon}
  const [agentOrder, setAgentOrder] = useState([]);
  const [checkout, setCheckout] = useState(null);
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async (query) => {
    setStatus("running");
    setAgents({});
    setAgentOrder([]);
    setCheckout(null);
    setGoal(null);
    setError(null);

    try {
      const apiUrl = `${API_BASE_URL}/shop`;
      console.log('[Meesho Sakhi] Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Meesho Sakhi] API Error Response:', response.status, errorText);
        throw new Error(`Server error: ${response.status}${errorText ? ` - ${errorText}` : ""}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleEvent(event);
          } catch {}
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
  }, []);

  return { status, agents, agentOrder, checkout, goal, error, run, reset };
}
