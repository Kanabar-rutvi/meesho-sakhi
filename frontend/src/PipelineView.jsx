import { AGENT_META, CATEGORY_ICONS } from "./constants";

function getAgentMeta(key) {
  // For category agents like filter_bedding, ranker_study, etc.
  for (const prefix of ["filter_", "ranker_", "selector_"]) {
    if (key.startsWith(prefix)) {
      const cat = key.replace(prefix, "");
      const typeLabel = prefix === "filter_" ? "Filter" : prefix === "ranker_" ? "Ranker" : "Selector";
      return {
        label: `${typeLabel} • ${cat}`,
        icon: CATEGORY_ICONS[cat] || "📦",
        color: prefix === "filter_" ? "#0ea5e9" : prefix === "ranker_" ? "#f59e0b" : "#22c55e"
      };
    }
  }
  return AGENT_META[key] || { label: key, icon: "🤖", color: "#9333ea" };
}

function AgentCard({ agentKey, agent }) {
  const meta = getAgentMeta(agentKey);
  const state = agent.state;

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "10px 12px",
      borderRadius: "10px",
      background: state === "done" ? "rgba(34,197,94,0.06)" : state === "running" ? "rgba(147,51,234,0.08)" : "transparent",
      border: `1px solid ${state === "done" ? "rgba(34,197,94,0.2)" : state === "running" ? "rgba(147,51,234,0.2)" : "transparent"}`,
      transition: "all 0.3s ease"
    }}>
      {/* Icon */}
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: state === "running" ? meta.color : state === "done" ? "#22c55e" : "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        flexShrink: 0,
        transition: "background 0.3s ease"
      }}>
        {state === "running" ? "⚡" : state === "done" ? "✓" : meta.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "12px",
          fontWeight: 600,
          color: state === "done" ? "#22c55e" : state === "running" ? meta.color : "#94a3b8",
          fontFamily: "'Inter', sans-serif",
          transition: "color 0.3s"
        }}>
          {agent.label || meta.label}
        </div>
        <div style={{
          fontSize: "11px",
          color: "#64748b",
          marginTop: "1px"
        }}>
          {state === "running" ? (agent.message || "Processing...") :
           state === "done" ? "Complete" : "Waiting"}
        </div>
      </div>

      {/* Status indicator */}
      <div style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: state === "done" ? "#22c55e" : state === "running" ? meta.color : "#e2e8f0",
        flexShrink: 0,
        marginTop: "4px",
        boxShadow: state === "running" ? `0 0 8px ${meta.color}` : "none",
        animation: state === "running" ? "pulse 1.5s infinite" : "none"
      }} />
    </div>
  );
}

export default function PipelineView({ agents, agentOrder, status }) {
  const runningCount = Object.values(agents).filter(a => a.state === "running").length;
  const doneCount = Object.values(agents).filter(a => a.state === "done").length;
  const totalSoFar = agentOrder.length;

  return (
    <div style={{
      background: "white",
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
      padding: "20px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #9333ea, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px"
          }}>🧠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#1a0533", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Agent Pipeline
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              {status === "done" ? `${doneCount} agents complete` :
               status === "running" ? `${doneCount}/${totalSoFar} done` : "Ready"}
            </div>
          </div>
        </div>
        {status === "running" && (
          <div style={{
            fontSize: "11px",
            color: "#9333ea",
            fontWeight: 600,
            background: "#f3e8ff",
            padding: "4px 8px",
            borderRadius: "20px"
          }}>
            LIVE
          </div>
        )}
        {status === "done" && (
          <div style={{
            fontSize: "11px",
            color: "#22c55e",
            fontWeight: 600,
            background: "#f0fdf4",
            padding: "4px 8px",
            borderRadius: "20px"
          }}>
            DONE ✓
          </div>
        )}
      </div>

      {/* Agent list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {agentOrder.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "24px",
            color: "#94a3b8",
            fontSize: "13px"
          }}>
            Agents will appear here as they run
          </div>
        ) : (
          agentOrder.map(key => (
            agents[key] ? <AgentCard key={key} agentKey={key} agent={agents[key]} /> : null
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
