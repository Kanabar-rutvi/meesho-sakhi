import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Heart, ArrowRight, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useLang } from '../i18n';
import { useAuth } from '../AuthContext';
import { CATEGORY_ICONS } from '../constants';

function PlanCard({ plan, expanded, onToggle }) {
  const progress = plan.budget > 0 ? Math.min(100, Math.round((plan.spent / plan.budget) * 100)) : 0;
  const planItems = plan.plan_items || [];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Plan Header — clickable to expand */}
      <div
        onClick={onToggle}
        style={{
          padding: 'clamp(16px, 4vw, 20px)', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(13px, 3.5vw, 15px)', marginBottom: '4px' }}>
            {plan.goal}
          </div>
          <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>{plan.date}</div>
          
          {/* Progress bar */}
          <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: progress === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
              borderRadius: 'var(--radius-full)', transition: 'width 1s ease'
            }} />
          </div>

          {/* Category tags */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(plan.categories || []).map(c => (
              <span key={c} style={{
                fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--brand-primary)',
                background: 'rgba(147,51,234,0.06)', padding: '3px 10px',
                borderRadius: 'var(--radius-full)', textTransform: 'capitalize', fontWeight: 600
              }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(13px, 3.5vw, 15px)', color: progress === 100 ? 'var(--success)' : 'var(--brand-primary)' }}>
            ₹{plan.spent.toLocaleString()}
          </div>
          <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--text-tertiary)' }}>
            of ₹{plan.budget.toLocaleString()} budget
          </div>
          <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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


export default function Dashboard() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);

  const baseUrl = (() => {
    const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
    return envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
  })();

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (user === null) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      const fetchData = async () => {
        try {
          const token = getToken();
          const headers = { 'Authorization': `Bearer ${token}` };
          
          const [histRes, wishRes] = await Promise.all([
            fetch(`${baseUrl}/user/history`, { headers }),
            fetch(`${baseUrl}/user/wishlist`, { headers })
          ]);
          
          if (histRes.ok) setHistory(await histRes.json());
          if (wishRes.ok) { const w = await wishRes.json(); setWishlistCount(w.length); }
        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [user, navigate, baseUrl]);


  const totalSaved = history.reduce((sum, h) => {
    const saved = Math.max(0, h.budget - h.spent);
    return sum + saved;
  }, 0);

  const totalItems = history.reduce((sum, h) => sum + (h.plan_items?.length || h.items || 0), 0);

  const stats = [
    { label: t('plansCreated') || 'Plans Created', value: history.length.toString(), icon: '🗺️', color: 'var(--brand-primary)' },
    { label: 'Total Items', value: totalItems.toString(), icon: '📦', color: 'var(--brand-secondary)' },
    { label: t('itemsSaved') || 'Wishlisted', value: wishlistCount.toString(), icon: '💾', color: '#ec4899' },
    { label: t('totalSaved') || 'Total Saved', value: `₹${totalSaved.toLocaleString()}`, icon: '💰', color: 'var(--success)' },
  ];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(16px, 5vw, 32px)' }}>

      {/* ─── Welcome Hero ─── */}
      <div className="animate-fade-in" style={{
        background: 'linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 60%, var(--brand-secondary) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(24px, 6vw, 40px) clamp(20px, 6vw, 48px)',
        color: 'white',
        marginBottom: 'clamp(24px, 5vw, 32px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', borderRadius: '50%', display: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 'clamp(24px, 5vw, 28px)' }}>👋</div>
            <span style={{ fontSize: 'clamp(11px, 3vw, 14px)', fontWeight: 600, opacity: 0.85, background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(8px)' }}>
              {t('goodEvening')} {user?.name || ''}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 7vw, 36px)', fontWeight: 800, marginBottom: '12px', lineHeight: 1.15, color: 'white' }}>
            {t('dashTitle')}
          </h1>
          <p style={{ fontSize: 'clamp(13px, 4vw, 16px)', opacity: 0.85, maxWidth: '480px', lineHeight: 1.6, marginBottom: '28px' }}>
            {t('dashDesc')}
          </p>
          <Link to="/app/ask" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'white', color: 'var(--brand-primary)',
            padding: 'clamp(12px, 2vw, 14px) clamp(20px, 4vw, 28px)', borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(13px, 3vw, 15px)',
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            transition: 'all var(--transition-fast)', flexWrap: 'wrap', justifyContent: 'center'
          }}>
            <Sparkles size={18} /> {t('startNewGoal')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'clamp(12px, 3vw, 16px)', marginBottom: 'clamp(24px, 5vw, 32px)' }}
           className="animate-fade-in">
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: 'clamp(16px, 3vw, 24px) clamp(12px, 2vw, 16px)' }}>
            <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(18px, 5vw, 24px)', color: stat.color, marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
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
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                No plans yet. Start a new shopping goal!
              </div>
            ) : history.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                expanded={expandedPlan === plan.id}
                onToggle={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
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
                { to: '/app/wishlist', icon: <Heart size={18} color="var(--brand-secondary)" />, label: t('wishlist') || 'Wishlist', sub: `${wishlistCount} items saved` },
                { to: '/app/history', icon: <Clock size={18} color="var(--text-secondary)" />, label: t('history') || 'History', sub: `${history.length} past plans` },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'clamp(10px, 2vw, 12px)', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', transition: 'all var(--transition-fast)', minWidth: '0' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(147,51,234,0.06)'}
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

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
