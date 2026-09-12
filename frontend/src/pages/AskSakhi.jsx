import { useState } from "react";
import { usePipeline } from "../usePipeline";
import PipelineView from "../PipelineView";
import CartView from "../CartView";
import ProgressiveCart from "../ProgressiveCart";
import ChatRefinement from "../components/ChatRefinement";
import { EXAMPLE_QUERIES } from "../constants";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

import { Mic, MicOff, Sparkles } from "lucide-react";

function InputPanel({ onSubmit, isRunning, onReset }) {
  const [query, setQuery] = useState(() => {
    const saved = sessionStorage.getItem('pending_sakhi_query');
    if (saved) {
      sessionStorage.removeItem('pending_sakhi_query');
      return saved;
    }
    return "";
  });
  const [isListening, setIsListening] = useState(false);
  const [guestNotice, setGuestNotice] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!user) {
      if (query.trim()) {
        sessionStorage.setItem('pending_sakhi_query', query.trim());
      }
      setGuestNotice(true);
      return;
    }
    if (query.trim() && !isRunning) onSubmit(query.trim());
  };

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
      <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-display)", display: "block", marginBottom: "8px" }}>
        Tell Sakhi what you need
      </label>
      
      <div style={{ position: "relative" }}>
        <textarea
          value={query}
          onChange={e => { setQuery(e.target.value); if (guestNotice) setGuestNotice(false); }}
          onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleSubmit()}
          placeholder="e.g. Help me set up my hostel room in Mumbai, budget ₹12,000..."
          disabled={isRunning}
          style={{ 
            width: "100%", minHeight: "120px", padding: "16px", paddingRight: "48px",
            borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", 
            fontSize: "15px", color: "var(--text-primary)", fontFamily: "var(--font-body)", 
            resize: "vertical", outline: "none", 
            background: isRunning ? "var(--bg-subtle)" : "var(--bg-card)", 
            marginBottom: "16px", transition: "border-color var(--transition-fast)" 
          }}
          onFocus={e => e.target.style.borderColor = "var(--brand-primary)"}
          onBlur={e => e.target.style.borderColor = "var(--border-color)"}
        />
        
        {/* Voice Input Button */}
        <button 
          onClick={toggleListening}
          disabled={isRunning}
          title="Speak your request"
          style={{
            position: "absolute", right: "12px", top: "12px",
            background: isListening ? "var(--brand-primary)" : "var(--bg-subtle)",
            color: isListening ? "white" : "var(--text-secondary)",
            border: "none", borderRadius: "var(--radius-full)",
            width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isRunning ? "not-allowed" : "pointer",
            transition: "all var(--transition-fast)"
          }}
        >
          {isListening ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "8px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Suggestions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button key={i} onClick={() => { setQuery(q); if (guestNotice) setGuestNotice(false); }} disabled={isRunning}
              className="btn btn-secondary"
              style={{ 
                fontSize: "12px", padding: "6px 12px", borderRadius: "var(--radius-full)"
              }}
            >
              {q.length > 40 ? q.slice(0, 40) + "…" : q}
            </button>
          ))}
        </div>
      </div>

      {guestNotice && (
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Sign in required for personalized planning</strong>
          Sakhi creates end-to-end encrypted shopping plans and tracks savings across sessions. Please sign in or create an account to run your plan.
          <button
            onClick={() => navigate('/auth')}
            className="btn btn-primary"
            style={{ marginTop: '10px', width: '100%', padding: '8px 12px', fontSize: '13px' }}
          >
            Continue to Sign In
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={handleSubmit} disabled={!query.trim() || isRunning}
          className="btn btn-primary"
          style={{ 
            flex: 1, 
            padding: "14px",
            fontSize: "15px",
            opacity: (!query.trim() || isRunning) ? 0.6 : 1
          }}>
          {isRunning ? "⚙️ Planning..." : (user ? "✨ Start Shopping" : "🔒 Sign In to Plan")}
        </button>
        {!isRunning && <button onClick={() => { onReset(); setQuery(""); setGuestNotice(false); }} className="btn btn-secondary" style={{ padding: "14px 20px" }}>Reset</button>}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "12px", textAlign: "center" }}>Press Ctrl+Enter to submit</div>
    </div>
  );
}

export default function AskSakhi() {
  const {
    status, agents, agentOrder, checkout, goal, error, run, reset,
    streamingExpected, streamingItems, streamingTotal, streamingCount,
    trustScores, itemReasons,
  } = usePipeline();
  
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      
      {/* ─── Page Header (Intro before function) ─── */}
      <div className="animate-fade-in" style={{
        marginBottom: '32px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '24px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          AI Assistant
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Let's find what you're looking for.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Tell me what you need, and we'll narrow down the options together.
        </p>
      </div>

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
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {status === "idle" && (
            <div className="card animate-fade-in" style={{ padding: "80px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", background: "var(--bg-main)", boxShadow: "none" }}>
              <div style={{ width: "64px", height: "64px", background: "var(--bg-card)", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-color)" }}>
                <Sparkles size={28} color="var(--brand-primary)" />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "24px", color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.01em" }}>Start a new shopping goal</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6, maxWidth: "420px" }}>
                Type your requirements in the input panel or use voice to quickly describe what you need. We'll handle the discovery and comparison.
              </div>
            </div>
          )}
          
          {status === "running" && (
            <div className="animate-fade-in">
              <ProgressiveCart
                streamingExpected={streamingExpected}
                streamingItems={streamingItems}
                streamingTotal={streamingTotal}
                streamingCount={streamingCount}
                trustScores={trustScores}
                itemReasons={itemReasons}
                status={status}
              />
            </div>
          )}
          
          {status === "done" && checkout && (
            <div className="animate-fade-in">
              {checkout.items?.length > 0 && (
                <CartView checkout={checkout} goal={goal} />
              )}
              <ChatRefinement 
                onRefine={(q) => run(q)} 
                checkout={checkout}
                isConversational={!checkout.items || checkout.items.length === 0}
              />
            </div>
          )}
          
          {error && (
            <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Something didn't go as planned
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6, maxWidth: '360px', margin: '0 auto 24px' }}>
                {error}
              </div>
              <button onClick={reset} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '14px' }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ask-sakhi-grid {
          display: grid;
          grid-template-columns: minmax(300px, 360px) 1fr;
          gap: 32px;
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
