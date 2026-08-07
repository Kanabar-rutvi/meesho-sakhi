import { useState } from "react";
import { usePipeline } from "../usePipeline";
import PipelineView from "../PipelineView";
import CartView from "../CartView";
import ChatRefinement from "../components/ChatRefinement";
import { EXAMPLE_QUERIES } from "../constants";

import { Mic, MicOff } from "lucide-react";

function InputPanel({ onSubmit, isRunning, onReset }) {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = () => { if (query.trim() && !isRunning) onSubmit(query.trim()); };

  const toggleListening = () => {
    if (isListening) return; // SpeechRecognition automatically stops after speech

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, voice input is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian English / Hindi mix

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setQuery(prev => prev ? prev + ' ' + transcript : transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: "20px", position: "relative" }}>
      <label style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", display: "block", marginBottom: "8px" }}>
        Tell Sakhi what you need
      </label>
      
      <div style={{ position: "relative" }}>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleSubmit()}
          placeholder="e.g. Help me set up my hostel room in Mumbai, budget ₹12,000..."
          disabled={isRunning}
          style={{ 
            width: "100%", minHeight: "100px", padding: "16px", paddingRight: "48px",
            borderRadius: "var(--radius-md)", border: "2px solid rgba(0,0,0,0.06)", 
            fontSize: "15px", color: "var(--text-primary)", fontFamily: "var(--font-body)", 
            resize: "vertical", outline: "none", 
            background: isRunning ? "var(--bg-subtle)" : "var(--bg-card)", 
            marginBottom: "16px", transition: "border-color var(--transition-fast)" 
          }}
          onFocus={e => e.target.style.borderColor = "var(--brand-primary)"}
          onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.06)"}
        />
        
        {/* Voice Input Button */}
        <button 
          onClick={toggleListening}
          disabled={isRunning}
          title="Speak your request"
          style={{
            position: "absolute", right: "12px", top: "12px",
            background: isListening ? "var(--brand-primary)" : "var(--purple-50)",
            color: isListening ? "white" : "var(--brand-primary)",
            border: "none", borderRadius: "50%",
            width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isRunning ? "not-allowed" : "pointer",
            transition: "all var(--transition-fast)",
            boxShadow: isListening ? "var(--shadow-glow)" : "none",
            animation: isListening ? "pulse-glow 1.5s infinite" : "none"
          }}
        >
          {isListening ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "8px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Suggestions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button key={i} onClick={() => setQuery(q)} disabled={isRunning}
              style={{ 
                fontSize: "12px", color: "var(--brand-primary)", 
                background: "rgba(147,51,234,0.06)", border: "1px solid rgba(147,51,234,0.15)", 
                borderRadius: "var(--radius-full)", padding: "6px 14px", 
                cursor: isRunning ? "not-allowed" : "pointer",
                transition: "all var(--transition-fast)",
                fontWeight: 500
              }}
              onMouseOver={e => !isRunning && (e.target.style.background = "var(--brand-primary)", e.target.style.color = "white")}
              onMouseOut={e => !isRunning && (e.target.style.background = "rgba(147,51,234,0.06)", e.target.style.color = "var(--brand-primary)")}
            >
              {q.length > 40 ? q.slice(0, 40) + "…" : q}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={handleSubmit} disabled={!query.trim() || isRunning}
          className={`btn ${isRunning || !query.trim() ? '' : 'btn-primary'}`}
          style={{ 
            flex: 1, 
            background: isRunning || !query.trim() ? "var(--bg-subtle)" : "", 
            color: isRunning || !query.trim() ? "var(--text-tertiary)" : "", 
            cursor: isRunning || !query.trim() ? "not-allowed" : "pointer",
            padding: "14px",
            fontSize: "15px"
          }}>
          {isRunning ? "⚙️ Agents Planning..." : "✨ Start Shopping"}
        </button>
        {!isRunning && <button onClick={() => { onReset(); setQuery(""); }} className="btn btn-secondary" style={{ padding: "14px 20px" }}>Reset</button>}
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "12px", textAlign: "center" }}>Press Ctrl+Enter to submit</div>
    </div>
  );
}

export default function AskSakhi() {
  const { status, agents, agentOrder, checkout, goal, error, run, reset } = usePipeline();
  
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Responsive grid — sidebar + main */}
      <div className="ask-sakhi-grid">
        {/* Left Column: Input and Pipeline */}
        <div className="ask-sakhi-sidebar">
          <InputPanel onSubmit={run} isRunning={status === "running"} onReset={reset} />
          {(status === "running" || status === "done") && (
            <PipelineView agents={agents} agentOrder={agentOrder} status={status} />
          )}
        </div>
        
        {/* Right Column: Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {status === "idle" && (
            <div className="card animate-fade-in" style={{ padding: "80px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", filter: "drop-shadow(0 4px 12px rgba(147, 51, 234, 0.3))" }}>🤖</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text-primary)", marginBottom: "16px" }}>Ready to plan your shopping</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1.6, maxWidth: "400px" }}>
                Tell Sakhi what you're trying to accomplish. Our agents will instantly build a complete, budget-optimized plan.
              </div>
            </div>
          )}
          
          {status === "running" && (
            <div className="card animate-fade-in" style={{ padding: "60px 40px", textAlign: "center", border: "2px solid rgba(147,51,234,0.15)", boxShadow: "var(--shadow-glow)" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px", animation: "pulse-glow 2s infinite", borderRadius: "50%", display: "inline-block" }}>✨</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--brand-primary)", marginBottom: "12px" }}>Agents are working...</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Watch the pipeline on the left as Sakhi curates your plan in real-time.</div>
            </div>
          )}
          
          {status === "done" && checkout && (
            <div className="animate-fade-in">
              <CartView checkout={checkout} goal={goal} />
              <ChatRefinement onRefine={(q) => console.log("Refine:", q)} />
            </div>
          )}
          
          {error && (
            <div className="card animate-fade-in" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" }}>
              <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "16px" }}>⚠️ Error Occurred</div>
              <div style={{ fontSize: "14px" }}>{error}</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ask-sakhi-grid {
          display: grid;
          grid-template-columns: minmax(300px, 360px) 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .ask-sakhi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
