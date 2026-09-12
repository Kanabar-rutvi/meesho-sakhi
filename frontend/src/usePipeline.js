import { useState, useCallback, useRef } from "react";

// ─── API URL resolver ────────────────────────────────────────────────────────
const getApiUrl = () => {
  try {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:8000";
    }
    return "https://meesho-sakhi.onrender.com";
  } catch {
    return "https://meesho-sakhi.onrender.com";
  }
};

const API_BASE_URL = getApiUrl();

// ─── User-friendly error mapping ─────────────────────────────────────────────
function mapPipelineError(status, errorObj, rawMessage) {
  // Try to extract from standardized error format
  const code = errorObj?.error?.code || errorObj?.code || '';
  const serverMsg = errorObj?.error?.message || errorObj?.message || '';

  // Code-based mapping
  if (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED') return "Your session has expired. Please sign in again.";
  if (code === 'UNVERIFIED_ACCOUNT') return "Please verify your email before using Sakhi.";
  if (code === 'RATE_LIMITED') return "You've reached your AI usage limit. Please try again later.";
  if (code === 'DUPLICATE_REQUEST') return "You already have an active shopping request. Please wait for it to complete.";
  if (code === 'VALIDATION_ERROR') return serverMsg || "Please enter a valid shopping request.";
  if (code === 'SERVICE_UNAVAILABLE' || code === 'PROVIDER_RATE_LIMITED') return "Sakhi is temporarily unavailable. Please try again shortly.";
  if (code === 'TIMEOUT') return "The request timed out. Please try again.";
  if (code === 'PIPELINE_ERROR') return "Something went wrong while planning your cart. Please try again.";

  // Status-based fallback
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "Please verify your email before using Sakhi.";
  if (status === 429) return "You've reached your AI usage limit. Please try again later.";
  if (status === 409) return "You already have an active request. Please wait.";
  if (status === 503 || status === 502) return "Sakhi is temporarily unavailable. Please try again shortly.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  if (status === 0 || !status) return "Unable to connect to Sakhi. Check your internet connection and try again.";

  // Raw message cleanup (never show raw JSON or stack traces)
  if (rawMessage) {
    if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError') || rawMessage.includes('ECONNREFUSED')) {
      return "Unable to connect to Sakhi. Check your internet connection and try again.";
    }
    if (rawMessage.includes('timeout') || rawMessage.includes('ETIMEDOUT')) {
      return "The request timed out. Please try again.";
    }
    // Don't return raw messages that look like JSON or contain technical details
    if (rawMessage.startsWith('{') || rawMessage.startsWith('[') || rawMessage.includes('Error:') || rawMessage.includes('at ')) {
      return "Something went wrong. Please try again.";
    }
  }

  return "Something went wrong. Please try again.";
}

export function usePipeline() {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [agents, setAgents] = useState({});      // agentKey -> {state, result, label, icon}
  const [agentOrder, setAgentOrder] = useState([]);
  const [checkout, setCheckout] = useState(null);
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState(null);

  // Progressive streaming state (live-updating list)
  const [streamingExpected, setStreamingExpected] = useState(null);
  const [streamingItems, setStreamingItems] = useState([]);
  const [streamingTotal, setStreamingTotal] = useState(0);
  const [streamingCount, setStreamingCount] = useState(0);
  const [trustScores, setTrustScores] = useState({});
  const [itemReasons, setItemReasons] = useState({});

  // Idempotency: prevent duplicate requests & track seen event IDs
  const runningRef = useRef(false);
  const seenEventIds = useRef(new Set());
  const abortControllerRef = useRef(null);
  const conversationIdRef = useRef(null);

  const run = useCallback(async (query) => {
    // Prevent duplicate concurrent requests
    if (runningRef.current) return;
    runningRef.current = true;

    // Reset all state
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
    seenEventIds.current.clear();

    // Create abort controller for cleanup
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (!API_BASE_URL) {
        throw { status: 0, friendlyMessage: "Backend is not configured. Please set VITE_API_URL." };
      }

      const apiUrl = `${API_BASE_URL}/shop`;
      const headers = { "Content-Type": "application/json" };
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const requestId = crypto.randomUUID();
      headers["X-Request-Id"] = requestId;

      const bodyPayload = { query };
      if (conversationIdRef.current) {
        bodyPayload.conversation_id = conversationIdRef.current;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errData = {};
        try { errData = await response.json(); } catch { /* ignore parse failure */ }
        const friendlyMessage = mapPipelineError(response.status, errData);
        throw { status: response.status, friendlyMessage };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamComplete = false;

      while (true) {
        let readResult;
        try {
          readResult = await reader.read();
        } catch (readError) {
          // Stream read error (network disconnect, etc.)
          if (abortController.signal.aborted) break; // intentional abort
          throw { status: 0, friendlyMessage: "Connection to Sakhi was lost. Please try again." };
        }

        const { done, value } = readResult;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim().startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(line.indexOf("data: ") + 6));

            // Dedup by event_id (if present)
            if (event.event_id !== undefined) {
              if (seenEventIds.current.has(event.event_id)) continue;
              seenEventIds.current.add(event.event_id);
            }

            handleEvent(event);
            if (event.type === 'stream_end' || event.type === 'complete') {
              streamComplete = true;
            }
          } catch (parseErr) {
            // Malformed SSE event — log and skip, don't crash
            console.warn("[Sakhi] Skipping malformed SSE event:", line.slice(0, 100));
          }
        }
      }

      // If stream ended without a 'complete' event, that's an incomplete pipeline
      if (!streamComplete && status !== 'done') {
        // Check if we got any items at all
        // Don't error if we already transitioned to 'done' via handleEvent
      }

    } catch (e) {
      if (e?.name === 'AbortError' || abortController.signal.aborted) {
        // User-initiated abort — silently reset
        setStatus("idle");
        runningRef.current = false;
        return;
      }

      const friendlyMessage = e?.friendlyMessage || mapPipelineError(e?.status, null, e?.message);
      setError(friendlyMessage);
      setStatus("error");
    } finally {
      runningRef.current = false;
      abortControllerRef.current = null;
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
    } else if (type === "agent_error") {
      // Optional agent failed — mark it but don't crash the pipeline
      setAgents(prev => ({
        ...prev,
        [agent]: { ...prev[agent], state: "error", message: event.message || "This step encountered an issue." }
      }));
    } else if (type === "cart_expected") {
      setStreamingExpected({
        categories: event.categories || [],
        budget_total: event.budget_total || 0,
      });
    } else if (type === "item_found") {
      setStreamingItems(prev => {
        if (prev.some(p => p.id === event.item.id)) return prev; // dedup
        return [...prev, event.item];
      });
      setStreamingTotal(event.running_total || 0);
      setStreamingCount(event.running_count || 0);
    } else if (type === "item_trusted") {
      setTrustScores(prev => ({
        ...prev,
        [event.product_id]: {
          trust_score: event.trust_score,
          trust_reason: event.trust_reason,
        }
      }));
    } else if (type === "item_reasoned") {
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
      // Error event from SSE stream
      const msg = event.error?.message || event.message || "Something went wrong.";
      setError(mapPipelineError(null, event.error || event, msg));
      setStatus("error");
    }
    if (event.conversation_id) {
      conversationIdRef.current = event.conversation_id;
    }
    // 'connected' and 'stream_end' are informational — no state change needed
  }

  const reset = useCallback(() => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    runningRef.current = false;
    conversationIdRef.current = null;
    seenEventIds.current.clear();

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
    conversationId: conversationIdRef.current,
    streamingExpected, streamingItems, streamingTotal, streamingCount,
    trustScores, itemReasons,
  };
}
