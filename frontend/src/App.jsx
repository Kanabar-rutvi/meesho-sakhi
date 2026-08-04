import { useState } from "react";
import { usePipeline } from "./usePipeline";
import PipelineView from "./PipelineView";
import CartView from "./CartView";
import { EXAMPLE_QUERIES } from "./constants";

function Header() {
  return (
    <header style={{
      background: "linear-gradient(135deg, #1a0533 0%, #2d0a52 100%)",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.3)"
    }}>
      <div style={{
        width: "40px", height: "40px",
        background: "linear-gradient(135deg, #9333ea, #ec4899)",
        borderRadius: "12px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px", flexShrink: 0
      }}>🛍️</div>
      <div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "18px", color: "white" }}>
          Meesho Sakhi
        </div>
        <div style={{ fontSize: "11px", color: "#c084fc" }}>AI-Powered Hostel Shopping Agent</div>
      </div>
      <div style={{ marginLeft: "auto" }}>
        <div style={{ fontSize: "11px", color: "#a855f7", background: "rgba(168,85,247,0.15)", padding: "4px 10px", borderRadius: "20px", border: "1px solid rgba(168,85,247,0.3)", fontWeight: 600 }}>
          8-Agent Pipeline
        </div>
      </div>
    </header>
  );
}

function InputPanel({ onSubmit, isRunning, onReset }) {
  const [query, setQuery] = useState("");
  const handleSubmit = () => { if (query.trim() && !isRunning) onSubmit(query.trim()); };
  return (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <label style={{ fontSize: "13px", fontWeight: 700, color: "#1a0533", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "block", marginBottom: "8px" }}>
        Tell Sakhi what you need
      </label>
      <textarea
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleSubmit()}
        placeholder="e.g. Help me set up my hostel room in Mumbai, budget ₹12,000..."
        disabled={isRunning}
        style={{ width: "100%", minHeight: "80px", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#1a0533", fontFamily: "'Inter', sans-serif", resize: "vertical", outline: "none", background: isRunning ? "#f8fafc" : "white", marginBottom: "12px" }}
        onFocus={e => e.target.style.borderColor = "#9333ea"}
        onBlur={e => e.target.style.borderColor = "#e2e8f0"}
      />
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>TRY AN EXAMPLE</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button key={i} onClick={() => setQuery(q)} disabled={isRunning}
              style={{ fontSize: "11px", color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "20px", padding: "4px 10px", cursor: "pointer" }}>
              {q.length > 38 ? q.slice(0, 38) + "…" : q}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={handleSubmit} disabled={!query.trim() || isRunning}
          style={{ flex: 1, padding: "12px", background: isRunning || !query.trim() ? "#e2e8f0" : "linear-gradient(135deg, #9333ea, #7c3aed)", color: isRunning || !query.trim() ? "#94a3b8" : "white", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: isRunning || !query.trim() ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {isRunning ? "⚙️ Agents Running..." : "✨ Start Shopping"}
        </button>
        {!isRunning && <button onClick={() => { onReset(); setQuery(""); }}
          style={{ padding: "12px 16px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>Reset</button>}
      </div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", textAlign: "center" }}>Ctrl+Enter to submit</div>
    </div>
  );
}

export default function App() {
  const { status, agents, agentOrder, checkout, goal, error, run, reset } = usePipeline();
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <Header />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <InputPanel onSubmit={run} isRunning={status === "running"} onReset={reset} />
          <PipelineView agents={agents} agentOrder={agentOrder} status={status} />
        </div>
        <div>
          {status === "idle" && (
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "60px 40px", textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛍️</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "22px", color: "#1a0533", marginBottom: "10px" }}>Your AI Shopping Companion</div>
              <div style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, maxWidth: "340px", margin: "0 auto" }}>
                Tell Sakhi your hostel setup goal and budget. Eight specialized AI agents will filter, rank, and curate the perfect cart — live, in real time.
              </div>
              <div style={{ display: "flex", gap: "24px", justifyContent: "center", marginTop: "28px", flexWrap: "wrap" }}>
                {[["🎯","Goal Understanding"],["🗺️","Smart Planning"],["⭐","Trust Scoring"],["🛒","Budget Optimization"]].map(([icon,label]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", marginBottom: "4px" }}>{icon}</div>
                    <div style={{ fontSize: "11px", color: "#9333ea", fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {status === "running" && (
            <div style={{ background: "white", borderRadius: "16px", border: "2px solid #e9d5ff", padding: "40px", textAlign: "center", boxShadow: "0 0 24px rgba(147,51,234,0.1)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "18px", color: "#9333ea", marginBottom: "8px" }}>Agents Working...</div>
              <div style={{ color: "#64748b", fontSize: "13px" }}>Watch the pipeline on the left as each agent fires in real time</div>
            </div>
          )}
          {status === "done" && checkout && <CartView checkout={checkout} goal={goal} />}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "16px", padding: "24px", color: "#dc2626" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>⚠️ Error</div>
              <div style={{ fontSize: "13px" }}>{error}</div>
              {error.includes("API") && <div style={{ marginTop: "12px", fontSize: "12px", color: "#94a3b8" }}>Make sure your ANTHROPIC_API_KEY is set in backend/.env</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
