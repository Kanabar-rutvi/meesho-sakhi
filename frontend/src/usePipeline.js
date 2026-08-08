import { useState, useCallback } from "react";

// Get API URL from environment variable or default to localhost for development
const getApiUrl = () => {
  // 1. Check environment variable first (set during build via VITE_API_URL)
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, "");
  }

  // 2. For local development, use localhost:8000 (proxied by Vite dev server)
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:8000";
  }

  // 3. Production requires VITE_API_URL to be set - do not fallback to current origin
  throw new Error(
    "VITE_API_URL environment variable is not configured. " +
    "For production deployment, set VITE_API_URL to your backend URL during build. " +
    "Example: export VITE_API_URL=https://api.example.com && npm run build"
  );
};

let API_BASE_URL;
try {
  API_BASE_URL = getApiUrl();
  console.log("[Meesho Sakhi] API Base URL:", API_BASE_URL);
} catch (error) {
  console.error("[Meesho Sakhi]", error.message);
  // Set a placeholder - the hook will catch this and show error UI
  API_BASE_URL = null;
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
      // Check if API URL is configured
      if (!API_BASE_URL) {
        throw new Error(
          "Backend API URL is not configured. " +
          "For production, set VITE_API_URL environment variable and rebuild. " +
          "For local development, make sure the backend is running on http://localhost:8000"
        );
      }

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
        
        // Provide helpful error messages
        if (response.status === 404) {
          throw new Error(
            `Backend endpoint not found (404). ` +
            `Verify VITE_API_URL is correct: ${API_BASE_URL} ` +
            `and the backend is running.`
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
