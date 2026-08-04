import { useState, useCallback } from "react";

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
      const response = await fetch("/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

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
