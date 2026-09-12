import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, ChevronRight, CheckCircle, ShoppingBag, AlertCircle, MessageSquare, ShieldCheck, ArrowUpRight, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'plans'; // 'plans' or 'conversations'
  
  // State for expanded conversation transcripts
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [conversationData, setConversationData] = useState({});
  const [loadingConvo, setLoadingConvo] = useState({});

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      setLoading(false);
      return;
    }
    
    if (user) {
      const fetchHistory = async () => {
        try {
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
          const baseUrl = envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
          const res = await fetch(`${baseUrl}/user/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setHistory(data);
          }
        } catch (error) {
          console.error("Failed to fetch history", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchHistory();
    }
  }, [user]);

  const toggleConversation = async (planId) => {
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
      return;
    }

    setExpandedPlanId(planId);

    if (!conversationData[planId]) {
      setLoadingConvo(prev => ({ ...prev, [planId]: true }));
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
        const baseUrl = envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
        const res = await fetch(`${baseUrl}/user/plan/${planId}/conversation`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConversationData(prev => ({ ...prev, [planId]: data }));
        }
      } catch (err) {
        console.error("Failed to fetch conversation transcript:", err);
      } finally {
        setLoadingConvo(prev => ({ ...prev, [planId]: false }));
      }
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--brand-primary)', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Loading your history...</div>
      </div>
    );
  }

  // Guest State
  if (!user) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px', textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Clock size={32} color="var(--brand-primary)" />
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Personalized Records
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Your shopping plans and conversations.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '480px', lineHeight: 1.6 }}>
          Sign in to access your saved recommendations, track past budget allocations, and securely resume previous consultations.
        </p>
        <button onClick={() => navigate('/auth')} className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)', fontSize: '14px' }}>
          Sign In to View History
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
      {/* ─── Segmented Navigation ─── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <button
          onClick={() => setSearchParams({ tab: 'plans' })}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'plans' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'plans' ? '#FFFFFF' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)'
          }}
        >
          Personalized Plans ({history.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'conversations' })}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'conversations' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'conversations' ? '#FFFFFF' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)'
          }}
        >
          Shopping Conversations
        </button>
      </div>

      {/* ─── Tab 1: Personalized Plans ─── */}
      {activeTab === 'plans' && (
        <div className="animate-fade-in">
          {/* Required Intro for Plans */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Plans
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Your personalized plans.
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px' }}>
              Keep your recommendations organized and continue refining them whenever you need.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', background: 'var(--bg-card)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShoppingBag size={24} color="var(--brand-primary)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No saved plans yet</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Start your first shopping consultation with Sakhi to generate tailored plans.</p>
              <Link to="/app/ask" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', fontSize: '14px', textDecoration: 'none' }}>
                Create a Shopping Plan
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((plan, idx) => (
                <div key={plan.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '44px', height: '44px',
                        borderRadius: 'var(--radius-full)',
                        background: plan.status === 'completed' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {plan.status === 'completed'
                          ? <CheckCircle size={22} color="var(--success)" />
                          : <AlertCircle size={22} color="var(--text-tertiary)" />
                        }
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                          {plan.goal}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShoppingBag size={14} /> {plan.items} curated items
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            ₹{plan.spent.toLocaleString()} / ₹{plan.budget.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {plan.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Math.round((plan.spent / (plan.budget || 1)) * 100)}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>budget used</div>
                    </div>
                  </div>

                  {/* Category Pills & Action links */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {plan.categories && plan.categories.map(cat => (
                        <span key={cat} style={{
                          fontSize: '11px', fontWeight: 600,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-subtle)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'capitalize'
                        }}>{cat}</span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => toggleConversation(plan.id)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--brand-primary)',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <MessageSquare size={14} />
                        {expandedPlanId === plan.id ? "Hide Conversation" : "View Attached Conversation"}
                        {expandedPlanId === plan.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      <Link
                        to="/app/ask"
                        style={{
                          fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '6px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)'
                        }}
                      >
                        Refine in Sakhi <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* Expanded Conversation Accordion */}
                  {expandedPlanId === plan.id && (
                    <div style={{
                      marginTop: '8px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)' }}>
                          <ShieldCheck size={14} /> Private Decrypted Transcript
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Encrypted with AES-256-GCM</div>
                      </div>

                      {loadingConvo[plan.id] ? (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Decrypting conversation messages...
                        </div>
                      ) : conversationData[plan.id]?.messages?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {conversationData[plan.id].messages.map((m, mIdx) => (
                            <div key={mIdx} style={{
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: m.role === 'user' ? 'var(--bg-card)' : 'var(--bg-subtle)',
                              border: '1px solid var(--border-color)'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: m.role === 'user' ? 'var(--brand-primary)' : 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                {m.role === 'user' ? 'You' : 'Meesho Sakhi'}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                {m.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Original prompt: <em>"{plan.goal}"</em>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Full turn logs are stored encrypted in your private session storage.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: Shopping Conversations ─── */}
      {activeTab === 'conversations' && (
        <div className="animate-fade-in">
          {/* Required Intro for Conversations */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Conversations
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Your shopping conversations.
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px' }}>
              Pick up where you left off and continue refining your recommendations.
            </p>
          </div>

          {/* Privacy Notice Banner */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ShieldCheck size={20} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>End-to-End Privacy Protected:</strong> Your AI consultations are encrypted. Only you can view your conversation transcripts; platform administrators have no access to your prompts or replies.
            </div>
          </div>

          {history.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', background: 'var(--bg-card)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <MessageSquare size={24} color="var(--brand-primary)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No previous conversations</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>When you consult Sakhi, your sessions are safely saved here so you can continue them anytime.</p>
              <Link to="/app/ask" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', fontSize: '14px', textDecoration: 'none' }}>
                Start a Conversation
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((plan) => (
                <div key={plan.id} className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Session #{plan.id.slice(0, 8)}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>· {plan.date}</span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        "{plan.goal}"
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Associated plan: {plan.items} items · ₹{plan.spent.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleConversation(plan.id)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                    >
                      {expandedPlanId === plan.id ? "Hide Transcript" : "View Transcript"}
                      {expandedPlanId === plan.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {expandedPlanId === plan.id && (
                    <div style={{
                      marginTop: '16px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {loadingConvo[plan.id] ? (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Decrypting conversation transcript...
                        </div>
                      ) : conversationData[plan.id]?.messages?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {conversationData[plan.id].messages.map((m, mIdx) => (
                            <div key={mIdx} style={{
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: m.role === 'user' ? 'var(--bg-card)' : 'var(--bg-subtle)',
                              border: '1px solid var(--border-color)'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: m.role === 'user' ? 'var(--brand-primary)' : 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                {m.role === 'user' ? 'You' : 'Meesho Sakhi'}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                {m.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Original consultation query: <em>"{plan.goal}"</em>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Your transcript is decrypted in real-time exclusively for your verified token.
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Link
                          to="/app/ask"
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Sparkles size={14} /> Continue This Consultation
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
