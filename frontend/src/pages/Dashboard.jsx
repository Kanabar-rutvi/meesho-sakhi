import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingBag, Clock, Heart, ArrowRight, Target, Zap, Shield } from 'lucide-react';
import { useLang } from '../i18n';

const STATS = [
  { label: 'Plans Created', value: '3', icon: '🗺️', color: 'var(--brand-primary)' },
  { label: 'Items Saved', value: '12', icon: '💾', color: 'var(--brand-secondary)' },
  { label: 'Total Saved', value: '₹4,200', icon: '💰', color: 'var(--success)' },
];

const RECENT_PLANS = [
  { id: 1, goal: 'Hostel room setup in Mumbai', progress: 89, spent: 13450, budget: 15000, date: 'Today', cats: ['bedding', 'study', 'kitchen'] },
  { id: 2, goal: 'Diwali outfit shopping', progress: 100, spent: 7200, budget: 8000, date: '3 days ago', cats: ['clothing'] },
];

export default function Dashboard() {
  const { t } = useLang();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

      {/* ─── Welcome Hero ─── */}
      <div className="animate-fade-in" style={{
        background: 'linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 60%, var(--brand-secondary) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 48px',
        color: 'white',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ fontSize: '28px' }}>👋</div>
            <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.85, background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(8px)' }}>
              {t('goodEvening')}
            </span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.15, color: 'white' }}>
            {t('dashTitle')}
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.85, maxWidth: '480px', lineHeight: 1.6, marginBottom: '28px' }}>
            {t('dashDesc')}
          </p>
          <Link to="/app/ask" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'white', color: 'var(--brand-primary)',
            padding: '14px 28px', borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
            textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            transition: 'all var(--transition-fast)'
          }}>
            <Sparkles size={18} /> {t('startNewGoal')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}
           className="animate-fade-in">
        {[
          { label: t('plansCreated'), value: '3', icon: '🗺️', color: 'var(--brand-primary)' },
          { label: t('itemsSaved'), value: '12', icon: '💾', color: 'var(--brand-secondary)' },
          { label: t('totalSaved'), value: '₹4,200', icon: '💰', color: 'var(--success)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', color: stat.color, marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Main Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

        {/* Recent Plans */}
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--brand-primary)" /> {t('recentPlans')}
            </h2>
            <Link to="/app/history" style={{ fontSize: '13px', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {t('viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {RECENT_PLANS.map(plan => (
              <Link key={plan.id} to="/app/ask" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ padding: '20px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{plan.goal}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{plan.date}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: plan.progress === 100 ? 'var(--success)' : 'var(--brand-primary)' }}>
                        {plan.progress}%
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>₹{plan.spent.toLocaleString()} spent</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{
                      height: '100%',
                      width: `${plan.progress}%`,
                      background: plan.progress === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 1s ease'
                    }} />
                  </div>
                  {/* Category tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {plan.cats.map(c => (
                      <span key={c} style={{ fontSize: '11px', color: 'var(--brand-primary)', background: 'rgba(147,51,234,0.06)', padding: '3px 10px', borderRadius: 'var(--radius-full)', textTransform: 'capitalize', fontWeight: 600 }}>{c}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">

          {/* Quick Actions */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>{t('quickActions')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/app/ask', icon: <Sparkles size={18} color="var(--brand-primary)" />, label: t('askSakhi'), sub: 'Start a new shopping goal' },
                { to: '/app/wishlist', icon: <Heart size={18} color="var(--brand-secondary)" />, label: t('wishlist'), sub: '4 items saved' },
                { to: '/app/history', icon: <Clock size={18} color="var(--text-secondary)" />, label: t('history'), sub: '3 past plans' },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', transition: 'all var(--transition-fast)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(147,51,234,0.06)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  >
                    <div style={{ width: '36px', height: '36px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.sub}</div>
                    </div>
                    <ArrowRight size={16} color="var(--text-tertiary)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sakhi Tips */}
          <div className="card" style={{ padding: '20px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Shield size={16} color="var(--brand-primary)" />
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{t('sakhiTip')}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('sakhiTipText')}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .stats-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
