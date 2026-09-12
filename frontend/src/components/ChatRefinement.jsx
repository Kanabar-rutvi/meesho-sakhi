import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';

/**
 * ChatRefinement: A conversational refinement UI that lets users
 * ask follow-up questions after the AI pipeline finishes.
 */
export default function ChatRefinement({ onRefine, isProcessing = false, checkout, isConversational }) {
  const initialText = !isConversational
    ? "Your Smart Cart is ready! 🎉 Want to make changes? Just tell me — I can swap items, adjust budgets, add extras, or remove things you don't need."
    : (checkout?.summary || "I'm ready to help you shop! Tell me what you need.");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch history if continuing a plan
  useEffect(() => {
    const fetchHistory = async () => {
      if (checkout?.raw_plan_id) {
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
          const res = await fetch(`${baseUrl}/user/plan/${checkout.raw_plan_id}/conversation`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setMessages(data);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to fetch chat history:", e);
        }
      }
      setMessages([{ role: 'assistant', text: initialText }]);
    };
    fetchHistory();
  }, [checkout?.raw_plan_id, initialText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Append real assistant response when checkout or summary updates from SSE
  useEffect(() => {
    if (checkout?.summary) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.text === checkout.summary) return prev;
        if (last && last.role === 'user') {
          return [...prev, { role: 'assistant', text: checkout.summary }];
        }
        return prev;
      });
    }
  }, [checkout]);

  const handleSend = (overrideText) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    const trimmed = textToSend.trim();
    if (!trimmed || isProcessing) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (onRefine) onRefine(trimmed);
  };

  const suggestions = [
    "Replace the pillow with something cheaper",
    "Add a table lamp under ₹500",
    "Remove electronics category",
    "Show me alternatives for bedding"
  ];

  return (
    <div className="card animate-fade-in" style={{
      marginTop: '24px',
      padding: '0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--border-color)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'var(--bg-subtle)'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
          background: 'var(--brand-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={16} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
            {isConversational ? "Chat with Sakhi" : "Refine with Sakhi"}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isConversational ? "I can answer questions or help you find new items" : "Ask me to change, swap, or add items"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        padding: '24px',
        maxHeight: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} className="animate-slide-up" style={{
            display: 'flex',
            gap: '12px',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-end'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
              background: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--brand-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
            </div>
            <div style={{
              background: msg.role === 'user' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              fontSize: '14px',
              lineHeight: 1.5,
              maxWidth: '75%',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)'
            }}>
              <div>{msg.text}</div>
              {msg.products && msg.products.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Items Recommended ({msg.products.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {msg.products.map((p, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', gap: '8px' }}>
                        <span style={{ color: msg.role === 'user' ? 'white' : 'var(--text-primary)' }}>• {p.name}</span>
                        <span style={{ fontWeight: 600, color: msg.role === 'user' ? 'white' : 'var(--text-primary)' }}>₹{p.price}</span>
                      </div>
                    ))}
                  </div>
                  {msg.total && (
                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, textAlign: 'right', color: msg.role === 'user' ? 'white' : 'var(--text-primary)' }}>
                      Total: ₹{msg.total.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSend(s)} className="btn btn-secondary" style={{
              fontSize: '12px', padding: '6px 12px', borderRadius: 'var(--radius-full)'
            }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', gap: '12px', alignItems: 'center',
        background: 'var(--bg-main)'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="e.g. Make it cheaper, remove shoes, swap mattress..."
          disabled={isProcessing}
          style={{
            flex: 1, padding: '12px 16px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            fontSize: '14px',
            outline: 'none',
            background: 'var(--bg-card)'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isProcessing}
          style={{
            width: '44px', height: '44px',
            borderRadius: 'var(--radius-full)',
            background: input.trim() ? 'var(--brand-primary)' : 'var(--bg-subtle)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition-fast)',
            flexShrink: 0
          }}
        >
          <Send size={18} color={input.trim() ? 'white' : 'var(--text-tertiary)'} />
        </button>
      </div>
    </div>
  );
}
