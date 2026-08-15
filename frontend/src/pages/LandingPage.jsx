import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Target, Zap, CheckCircle, Star, ArrowRight, ShoppingBag } from 'lucide-react';
import { useLang } from '../i18n';

const TESTIMONIALS = [
  { name: 'Priya S.', location: 'Mumbai', quote: 'Set up my entire hostel room in 10 minutes. Sakhi found everything within budget!', stars: 5 },
  { name: 'Rahul M.', location: 'Bangalore', quote: 'The trust scores helped me avoid fake reviews. Amazing AI experience.', stars: 5 },
  { name: 'Ananya K.', location: 'Delhi', quote: 'Switched from generic searches to Sakhi. Never going back.', stars: 5 },
  { name: 'Neha V.', location: 'Pune', quote: 'Planned my entire Diwali outfit shopping in one prompt. Stunning results.', stars: 5 },
  { name: 'Vikram R.', location: 'Hyderabad', quote: 'Saved ₹3,000 on my kitchen setup because Sakhi optimized the cart.', stars: 5 },
];

const EXAMPLE_CARTS = [
  {
    goal: "Hostel room setup",
    budget: "₹15,000",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600",
    items: ["Orthopedic Mattress", "Study Lamp", "Laundry Basket", "Wall Organizers"]
  },
  {
    goal: "Diwali ethnic wear",
    budget: "₹8,000",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
    items: ["Embroidered Kurta", "Silver Jhumkas", "Matching Juttis", "Potli Bag"]
  },
  {
    goal: "First kitchen basics",
    budget: "₹5,000",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600",
    items: ["Non-stick Cookware", "Spice Rack", "Storage Containers", "Knife Set"]
  }
];

const _FEATURES = [
  {
    icon: '🎯',
    color: 'var(--brand-primary)',
    title: 'Goal Understanding',
    desc: 'Tell Sakhi what you\'re setting up. She understands context, not just keywords.',
  },
  {
    icon: '🗺️',
    color: '#7c3aed',
    title: 'Smart Planning',
    desc: 'Sakhi breaks your goal into budget-allocated categories, automatically balancing essentials.',
  },
  {
    icon: '🔍',
    color: '#0ea5e9',
    title: 'Review Trust Analysis',
    desc: 'Every product gets a trust score based on review authenticity and purchase volume.',
  },
  {
    icon: '🛒',
    color: 'var(--success)',
    title: 'Budget Optimization',
    desc: 'The selector agent keeps spending under your limit while maximizing product quality.',
  },
];

export default function LandingPage() {
  const { t } = useLang();

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="mesh-gradient-hero" style={{
        padding: '120px 24px 140px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--brand-primary) 0%, transparent 60%)', opacity: 0.25, filter: 'blur(60px)', animation: 'floatY 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--brand-secondary) 0%, transparent 60%)', opacity: 0.2, filter: 'blur(80px)', animation: 'floatY 10s ease-in-out infinite reverse' }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="animate-fade-in glass-panel" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '14px', marginBottom: '32px', color: 'var(--text-primary)' }}>
            <Sparkles size={16} color="var(--brand-primary)" /> {t('heroBadge')}
          </div>

          <h1 className="animate-fade-in" style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px', lineHeight: 1.05, letterSpacing: '-2px', animationDelay: '0.1s' }}>
            {t('heroTitleP1')}<br />
            <span className="text-gradient">
              {t('heroTitleP2')}
            </span>
          </h1>

          <p className="animate-fade-in" style={{ fontSize: 'clamp(18px, 3vw, 22px)', color: 'var(--text-secondary)', marginBottom: '48px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 48px', animationDelay: '0.2s' }}>
            {t('heroSubtitle')}
          </p>

          <div className="animate-fade-in" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px', animationDelay: '0.3s' }}>
            <Link to="/app/ask" className="btn btn-primary" style={{ padding: '20px 48px', fontSize: '18px', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-glow)' }}>
              {t('startWithSakhi')} <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── INFINITE MARQUEE CAROUSEL ────────────────────────────────── */}
      <section style={{ padding: '40px 0', background: 'var(--bg-main)', borderBottom: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {/* Double the content for smooth infinite scrolling */}
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t_item, i) => (
              <div key={i} className="card" style={{ width: '340px', display: 'inline-block', flexShrink: 0, whiteSpace: 'normal', boxShadow: 'var(--shadow-md)', border: 'none', background: 'white' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {Array.from({ length: t_item.stars }).map((_, j) => <Star key={j} size={16} color="var(--brand-primary)" fill="var(--brand-primary)" />)}
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '16px' }}>
                  &quot;{t_item.quote}&quot;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--brand-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                    {t_item.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{t_item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t_item.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EXAMPLE CARTS SHOWCASE ─────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'var(--bg-main)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: '16px', color: 'var(--text-primary)' }}>
              See what Sakhi can build
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Real goals translated into optimized, budget-perfect shopping carts in seconds.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {EXAMPLE_CARTS.map((cart, i) => (
              <div key={i} className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 150}ms`, borderRadius: 'var(--radius-xl)' }}>
                <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={cart.image} 
                    alt={cart.goal}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                    Budget: {cart.budget}
                  </div>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Goal</div>
                  <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>&quot;{cart.goal}&quot;</h3>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px', fontWeight: 600 }}>SAKHI SELECTED:</div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {cart.items.map((item, j) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <CheckCircle size={14} color="var(--success)" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/app/ask" className="btn btn-secondary">
              Try generating your own <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="mesh-gradient-hero" style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'var(--bg-card)', color: 'var(--brand-primary)', padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '14px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
            {t('simpleProcess')}
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: '80px', color: 'var(--text-primary)', letterSpacing: '-1px' }}>
            {t('howSakhiWorks')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            {[
              { step: '1', icon: <Target size={36} color="white" />, title: t('step1Title'), desc: t('step1Desc'), bg: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%)', shadow: 'var(--shadow-glow)' },
              { step: '2', icon: <Zap size={36} color="white" />, title: t('step2Title'), desc: t('step2Desc'), bg: 'linear-gradient(135deg, var(--brand-secondary) 0%, var(--brand-secondary-light) 100%)', shadow: 'var(--shadow-secondary)' },
              { step: '3', icon: <ShoppingBag size={36} color="white" />, title: t('step3Title'), desc: t('step3Desc'), bg: 'linear-gradient(135deg, var(--brand-accent) 0%, #d97706 100%)', shadow: '0 16px 32px rgba(245, 158, 11, 0.4)' },
            ].map((s, i) => (
              <div key={i} className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '56px 40px', animationDelay: `${i * 150}ms` }}>
                <div style={{ display: 'inline-flex', padding: '24px', background: s.bg, borderRadius: 'var(--radius-xl)', marginBottom: '32px', boxShadow: s.shadow, transform: 'rotate(-5deg) scale(1.05)', transition: 'transform 0.4s ease' }}
                     onMouseOver={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1.1)'}
                     onMouseOut={e => e.currentTarget.style.transform = 'rotate(-5deg) scale(1.05)'}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 800 }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '17px' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ padding: '64px 24px', background: 'var(--bg-dark)', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛍️</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'white', fontSize: '20px' }}>{t('appName')}</span>
        </div>
        <p style={{ fontSize: '15px', marginBottom: '24px', color: 'rgba(255,255,255,0.8)' }}>{t('builtForBharat')}</p>
        <p style={{ fontSize: '13px', opacity: 0.5, maxWidth: '400px', margin: '0 auto' }}>
          Not affiliated with Meesho. Sakhi is an independent AI-powered shopping companion.
        </p>
      </footer>
    </div>
  );
}
