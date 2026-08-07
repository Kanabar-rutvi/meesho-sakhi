import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';

/**
 * ChatRefinement: A conversational refinement UI that lets users
 * ask follow-up questions after the AI pipeline finishes.
 * e.g. "Replace the pillow with something cheaper", "Add a table lamp under ₹500"
 */
export default function ChatRefinement({ onRefine, isProcessing = false }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Your Smart Cart is ready! 🎉 Want to make changes? Just tell me — I can swap items, adjust budgets, add extras, or remove things you don't need."
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    const userMsg = { role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate an AI response (Phase 9 stub — replace with actual backend call)
    setTimeout(() => {
      const response = generateStubResponse(trimmed);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      if (onRefine) onRefine(trimmed);
    }, 800);
  };

  const suggestions = [
    "Replace the pillow with something cheaper",
    "Add a table lamp under ₹500",
    "Remove electronics category",
    "Show me alternatives for bedding"
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid rgba(0,0,0,0.06)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      marginTop: '24px'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'linear-gradient(135deg, rgba(147,51,234,0.04) 0%, rgba(236,72,153,0.04) 100%)'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={16} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
            Refine with Sakhi
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Ask me to change, swap, or add items
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        padding: '16px 24px',
        maxHeight: '320px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} className="animate-fade-in" style={{
            display: 'flex',
            gap: '10px',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: 'var(--radius-full)',
              background: msg.role === 'user' ? 'var(--brand-secondary)' : 'var(--brand-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="white" />}
            </div>
            <div style={{
              background: msg.role === 'user' ? 'var(--brand-primary)' : 'var(--bg-subtle)',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              padding: '10px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              fontSize: '14px',
              lineHeight: 1.5,
              maxWidth: '80%'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)} style={{
              fontSize: '12px', color: 'var(--brand-primary)',
              background: 'rgba(147,51,234,0.06)',
              border: '1px solid rgba(147,51,234,0.15)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              fontWeight: 500
            }}
            onMouseOver={e => { e.target.style.background = 'rgba(147,51,234,0.12)'; }}
            onMouseOut={e => { e.target.style.background = 'rgba(147,51,234,0.06)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 24px 16px',
        borderTop: '1px solid rgba(0,0,0,0.04)',
        display: 'flex', gap: '10px', alignItems: 'center'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="e.g. Swap the mattress with a foldable one..."
          disabled={isProcessing}
          style={{
            flex: 1, padding: '12px 16px',
            borderRadius: 'var(--radius-full)',
            border: '2px solid rgba(0,0,0,0.06)',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
            background: 'var(--bg-subtle)'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'}
          onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.06)'}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing}
          style={{
            width: '44px', height: '44px',
            borderRadius: 'var(--radius-full)',
            background: input.trim() ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' : 'var(--bg-subtle)',
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

function generateStubResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('remove')) return "Done! I've removed that item from your cart. Your total has been updated. 🗑️";
  if (q.includes('replace') || q.includes('swap')) return "I found a great alternative! I've swapped it in your cart. Check the updated items above. 🔄";
  if (q.includes('add')) return "Added to your cart! I picked the best-rated option within your remaining budget. ✨";
  if (q.includes('cheaper') || q.includes('budget')) return "I found a more budget-friendly option with similar ratings. Swapped it in! 💰";
  if (q.includes('alternative')) return "Here are some alternatives I found. I've updated the cart with the top pick. Want me to show you more options? 🔍";
  return "I understand! Let me adjust your cart accordingly. The changes are reflected above. Let me know if you want anything else! 🛒";
}
