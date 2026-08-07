import { AGENT_META, CATEGORY_ICONS } from "./constants";

function getAgentMeta(key) {
  for (const prefix of ["filter_", "ranker_", "selector_"]) {
    if (key.startsWith(prefix)) {
      const cat = key.replace(prefix, "");
      const typeLabel = prefix === "filter_" ? "Filter" : prefix === "ranker_" ? "Ranker" : "Selector";
      return {
        label: `${typeLabel} • ${cat}`,
        icon: CATEGORY_ICONS[cat] || "📦",
        color: prefix === "filter_" ? "#0ea5e9" : prefix === "ranker_" ? "#f59e0b" : "var(--success)"
      };
    }
  }
  return AGENT_META[key] || { label: key, icon: "🤖", color: "var(--brand-primary)" };
}

function AgentCard({ agentKey, agent }) {
  const meta = getAgentMeta(agentKey);
  const state = agent.state;

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "10px 14px",
      borderRadius: "var(--radius-md)",
      background: state === "done"
        ? "rgba(16,185,129,0.06)"
        : state === "running"
        ? "rgba(147,51,234,0.06)"
        : "transparent",
      border: `1px solid ${
        state === "done"
          ? "rgba(16,185,129,0.15)"
          : state === "running"
          ? "rgba(147,51,234,0.15)"
          : "transparent"
      }`,
      transition: "all 0.3s ease"
    }}>
      {/* Icon */}
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "var(--radius-sm)",
        background: state === "running" ? meta.color : state === "done" ? "var(--success)" : "var(--bg-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        flexShrink: 0,
        transition: "background 0.3s ease",
        color: state === "running" || state === "done" ? "white" : "inherit"
      }}>
        {state === "running" ? "⚡" : state === "done" ? "✓" : meta.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px",
          fontWeight: 600,
          color: state === "done" ? "var(--success)" : state === "running" ? meta.color : "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          transition: "color 0.3s"
        }}>
          {agent.label || meta.label}
        </div>
        <div style={{
          fontSize: "11px",
          color: "var(--text-tertiary)",
          marginTop: "2px"
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
        background: state === "done" ? "var(--success)" : state === "running" ? meta.color : "var(--bg-subtle)",
        flexShrink: 0,
        marginTop: "6px",
        boxShadow: state === "running" ? `0 0 8px ${meta.color}` : "none",
        animation: state === "running" ? "agentPulse 1.5s infinite" : "none"
      }} />
    </div>
  );
}

export default function PipelineView({ agents, agentOrder, status }) {
  const doneCount = Object.values(agents).filter(a => a.state === "done").length;
  const totalSoFar = agentOrder.length;

  return (
    <div className="card" style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px",
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px"
          }}>🧠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              Agent Pipeline
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              {status === "done" ? `${doneCount} agents complete` :
               status === "running" ? `${doneCount}/${totalSoFar} done` : "Ready"}
            </div>
          </div>
        </div>
        {status === "running" && (
          <div style={{
            fontSize: "11px",
            color: "var(--brand-primary)",
            fontWeight: 700,
            background: "rgba(147,51,234,0.08)",
            padding: "4px 12px",
            borderRadius: "var(--radius-full)",
            animation: "agentPulse 2s infinite",
            letterSpacing: "0.5px"
          }}>
            LIVE
          </div>
        )}
        {status === "done" && (
          <div style={{
            fontSize: "11px",
            color: "var(--success)",
            fontWeight: 700,
            background: "rgba(16,185,129,0.08)",
            padding: "4px 12px",
            borderRadius: "var(--radius-full)"
          }}>
            DONE ✓
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalSoFar > 0 && (
        <div style={{
          height: "4px",
          background: "var(--bg-subtle)",
          borderRadius: "var(--radius-full)",
          overflow: "hidden",
          marginBottom: "16px"
        }}>
          <div style={{
            height: "100%",
            width: `${totalSoFar > 0 ? (doneCount / totalSoFar) * 100 : 0}%`,
            background: status === "done"
              ? "var(--success)"
              : "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
            borderRadius: "var(--radius-full)",
            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
          }} />
        </div>
      )}

      {/* Agent list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {agentOrder.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "24px",
            color: "var(--text-tertiary)",
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
        @keyframes agentPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
