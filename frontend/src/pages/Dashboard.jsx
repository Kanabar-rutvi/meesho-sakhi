import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Heart, ArrowRight, Shield, ChevronDown, ChevronUp, MessageSquare, Trash2, X, User, Bot, ShoppingBag } from 'lucide-react';
import { useLang } from '../i18n';
import { useAuth } from '../AuthContext';
import { CATEGORY_ICONS } from '../constants';

function PlanCard({ plan, expanded, onToggle, onOpenChat, onDeletePlan }) {
  const progress = plan.budget > 0 ? Math.min(100, Math.round((plan.spent / plan.budget) * 100)) : 0;
  const planItems = plan.plan_items || [];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      {/* Plan Header */}
      <div
        style={{
          padding: 'clamp(16px, 4vw, 20px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div
            onClick={onToggle}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 'clamp(14px, 3.5vw, 16px)', marginBottom: '4px',
              cursor: 'pointer', color: 'var(--text-primary)'
            }}
          >
            {plan.plan_name || plan.goal}
          </div>
          <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            {plan.date} {plan.saved > 0 && <span style={{ color: 'var(--success)', fontWeight: 600 }}>• ₹{plan.saved.toLocaleString()} Saved</span>}
          </div>
          
          {/* Progress bar */}
          <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: progress === 100 ? 'var(--success)' : 'var(--brand-primary)',
              borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease'
            }} />
          </div>

          {/* Category tags */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {(plan.categories || []).map(c => (
              <span key={c} style={{
                fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--text-secondary)',
                background: 'var(--bg-subtle)', padding: '3px 10px',
                borderRadius: 'var(--radius-full)', textTransform: 'capitalize', fontWeight: 600
              }}>{c}</span>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => onOpenChat(plan)}
              className="btn btn-secondary"
              style={{
                fontSize: '12px', padding: '6px 12px', borderRadius: 'var(--radius-full)',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
              title="View the AI conversation that generated this plan"
            >
              <MessageSquare size={13} color="var(--brand-primary)" /> Chat History
            </button>

            <button
              onClick={() => onDeletePlan(plan)}
              style={{
                fontSize: '12px', padding: '6px 12px', borderRadius: 'var(--radius-full)',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', cursor: 'pointer', transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              title="Delete this shopping plan"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'var(--brand-primary)' }}>
            ₹{plan.spent.toLocaleString()}
          </div>
          <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--text-tertiary)' }}>
            of ₹{plan.budget.toLocaleString()} budget
          </div>
          <div
            onClick={onToggle}
            style={{
              fontSize: 'clamp(11px, 2vw, 12px)', color: 'var(--brand-primary)',
              display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
              marginTop: '4px', fontWeight: 600
            }}
          >
            {planItems.length} items {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expandable Items Section */}
      {expanded && planItems.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border-color)',
          padding: 'clamp(12px, 3vw, 16px)',
          background: 'var(--bg-subtle)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Recommended Items
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {planItems.map(item => {
              const icon = CATEGORY_ICONS?.[item.category] || '📦';
              const trustPct = Math.round((item.trust_score || 0.7) * 100);
              const trustColor = trustPct >= 80 ? 'var(--success)' : trustPct >= 60 ? 'var(--warning)' : 'var(--error)';
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'var(--bg-card)', padding: '12px',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ textTransform: 'capitalize' }}>{item.category}</span>
                      {item.quantity > 1 && <span>Qty: {item.quantity}</span>}
                      <span style={{ color: trustColor, fontWeight: 600 }}>{trustPct}% trust</span>
                    </div>
                    {item.reason && (
                      <div style={{ fontSize: '11px', color: 'var(--brand-primary)', marginTop: '4px', fontStyle: 'italic' }}>
                        {item.reason.length > 80 ? item.reason.slice(0, 80) + '…' : item.reason}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--brand-primary)', flexShrink: 0, fontFamily: 'var(--font-display)' }}>
                    ₹{item.price.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plan Chat History Modal ──────────────────────────────────────────────────
function ChatHistoryModal({ plan, baseUrl, getToken, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConv() {
      try {
        const token = getToken();
        const res = await fetch(`${baseUrl}/user/plan/${plan.raw_plan_id}/conversation`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load plan chat history:", err);
      } finally {
        setLoading(false);
      }
    }
    if (plan?.raw_plan_id) loadConv();
  }, [plan, baseUrl, getToken]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="card animate-fade-in" style={{
        width: '100%', maxWidth: '640px', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', padding: 0,
        overflow: 'hidden', boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-subtle)'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
              💬 Chat History — {plan.plan_name || plan.goal}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Created on {plan.date} • Budget ₹{plan.budget?.toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message timeline */}
        <div style={{
          padding: '20px', overflowY: 'auto', flex: 1,
          display: 'flex', flexDirection: 'column', gap: '16px',
          background: 'var(--bg-card)'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
              No chat logs found for this plan.
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    gap: '10px',
                    alignItems: 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                    background: isUser ? 'var(--text-secondary)' : 'var(--brand-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isUser ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
                  </div>

                  <div style={{
                    background: isUser ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding: '12px 16px', fontSize: '14px', lineHeight: 1.5
                  }}>
                    <div>{m.text}</div>

                    {m.products && m.products.length > 0 && (
                      <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8, marginBottom: '6px' }}>
                          Items Recommended ({m.products.length}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {m.products.map((p, pIdx) => (
                            <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', gap: '8px' }}>
                              <span>• {p.name}</span>
                              <span style={{ fontWeight: 600 }}>₹{p.price}</span>
                            </div>
                          ))}
                        </div>
                        {m.total && (
                          <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>
                            Total: ₹{m.total.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{
                      fontSize: '10px', opacity: 0.7, marginTop: '6px',
                      textAlign: isUser ? 'right' : 'left'
                    }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({ plan, onConfirm, onCancel, deleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px', textAlign: 'center' }}>🗑️</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
          Delete Shopping Plan?
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'center', marginBottom: '20px' }}>
          Are you sure you want to delete <strong>&ldquo;{plan.plan_name || plan.goal}&rdquo;</strong>?
          This plan and its items will be permanently removed from your dashboard and savings calculations.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, padding: '10px', background: '#ef4444', color: '#ffffff',
              border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer'
            }}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [statsData, setStatsData] = useState({
    plans_created: 0,
    total_items: 0,
    items_saved: 0,
    total_saved: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [selectedPlanForChat, setSelectedPlanForChat] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const baseUrl = (() => {
    const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
    return envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
  })();

  const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [histRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/user/history`, { headers }),
        fetch(`${baseUrl}/user/dashboard-stats`, { headers })
      ]);
      
      if (histRes.ok) {
        const hist = await histRes.json();
        setHistory(hist);
      }

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setStatsData(stats);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchDashboardData();
    }
  }, [user, navigate, baseUrl]);

  // Handle Plan Deletion
  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/user/plan/${planToDelete.raw_plan_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Remove locally from history
        setHistory(prev => prev.filter(p => p.raw_plan_id !== planToDelete.raw_plan_id));
        setPlanToDelete(null);
        // Refresh authoritative statistics
        fetchDashboardData();
      } else {
        alert("Failed to delete plan. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
      alert("Something went wrong while deleting the plan.");
    } finally {
      setDeleting(false);
    }
  };

  const stats = [
    { label: t('plansCreated') || 'Active Plans', value: statsData.plans_created.toString(), icon: <Sparkles size={20} />, color: 'var(--brand-primary)' },
    { label: 'Total Items', value: statsData.total_items.toString(), icon: <ShoppingBag size={20} />, color: 'var(--text-primary)' },
    { label: t('itemsSaved') || 'Wishlisted', value: statsData.items_saved.toString(), icon: <Heart size={20} />, color: 'var(--text-primary)' },
    { label: t('totalSaved') || 'Total Saved', value: `₹${statsData.total_saved.toLocaleString()}`, icon: <Shield size={20} />, color: 'var(--success)' },
  ];

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(16px, 5vw, 32px)' }}>

      {/* ─── Page Header (Intro before function) ─── */}
      <div className="animate-fade-in" style={{
        marginBottom: '40px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Welcome back, {user?.name || 'User'}
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
              Manage your personalized shopping plans, review past conversations, and continue discovering products tailored to your preferences.
            </p>
          </div>
          <Link to="/app/ask" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--brand-primary)', color: 'white',
            fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Sparkles size={16} /> Start New Plan
          </Link>
        </div>
      </div>

      {/* ─── Overview Stats ─── */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Dashboard Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }} className="animate-fade-in">
          {stats.map((stat, i) => (
            <div key={i} style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Main Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(16px, 4vw, 24px)', alignItems: 'start' }}>

        {/* Recent Plans with Items */}
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: 'clamp(14px, 4vw, 18px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--brand-primary)" /> {t('recentPlans') || 'Your Shopping Plans'}
            </h2>
            <Link to="/app/history" style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {t('viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                No active plans yet. Click &ldquo;Start Shopping&rdquo; to build your first plan!
              </div>
            ) : history.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                expanded={expandedPlan === plan.id}
                onToggle={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                onOpenChat={(p) => setSelectedPlanForChat(p)}
                onDeletePlan={(p) => setPlanToDelete(p)}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">

          {/* Quick Actions */}
          <div className="card" style={{ padding: 'clamp(16px, 4vw, 20px)' }}>
            <h2 style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', marginBottom: '16px' }}>{t('quickActions') || 'Quick Actions'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/app/ask', icon: <Sparkles size={18} color="var(--brand-primary)" />, label: t('askSakhi') || 'Ask Sakhi', sub: 'Start a new shopping goal' },
                { to: '/app/wishlist', icon: <Heart size={18} color="var(--brand-secondary)" />, label: t('wishlist') || 'Wishlist', sub: `${statsData.items_saved} items saved` },
                { to: '/app/history', icon: <Clock size={18} color="var(--text-secondary)" />, label: t('history') || 'History', sub: `${history.length} past plans` },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'clamp(10px, 2vw, 12px)', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', transition: 'all var(--transition-fast)', minWidth: '0' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  >
                    <div style={{ width: '36px', height: '36px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: '0', overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: 'clamp(13px, 3vw, 14px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                      <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sakhi Tips */}
          <div className="card" style={{ padding: 'clamp(16px, 4vw, 20px)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <Shield size={16} color="var(--brand-primary)" />
              <span style={{ fontWeight: 700, fontSize: 'clamp(13px, 3vw, 14px)', color: 'var(--text-primary)' }}>{t('sakhiTip')}</span>
            </div>
            <p style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('sakhiTipText')}
            </p>
          </div>
        </div>
      </div>

      {/* Chat History Modal */}
      {selectedPlanForChat && (
        <ChatHistoryModal
          plan={selectedPlanForChat}
          baseUrl={baseUrl}
          getToken={getToken}
          onClose={() => setSelectedPlanForChat(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <DeleteConfirmModal
          plan={planToDelete}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPlanToDelete(null)}
        />
      )}
    </div>
  );
}
