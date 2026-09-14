import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, ChevronRight, ChevronLeft, Heart, Shield, 
  CheckCircle2, Compass, Layers, Sliders, ShieldCheck, Lock, 
  TrendingUp, Star, RefreshCw
} from 'lucide-react';
import { getApiUrl } from '../constants';
import ProductCard from '../components/ProductCard';

export default function LandingPage() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Fashion');
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const carouselRef = useRef(null);

  const categories = ['Fashion', 'Electronics', 'Home & Living', 'Beauty', 'Accessories'];

  // Load all products initially for carousels
  useEffect(() => {
    fetch(`${getApiUrl()}/products?limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setAllProducts(data.products);
        }
      })
      .catch(console.error);
  }, []);

  // Load category-specific products (minimum 6)
  useEffect(() => {
    setLoadingCategory(true);
    fetch(`${getApiUrl()}/products?category=${encodeURIComponent(activeCategory)}&limit=10`)
      .then(res => res.json())
      .then(data => {
        setCategoryProducts(data.products || []);
      })
      .catch(console.error)
      .finally(() => setLoadingCategory(false));
  }, [activeCategory]);

  const toggleWishlist = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Carousels data derived from actual backend products
  const featuredProducts = allProducts.slice(0, 8);
  const trendingTech = allProducts.filter(p => p.category === 'Electronics').slice(0, 6);
  const homeEssentials = allProducts.filter(p => p.category === 'Home & Living').slice(0, 6);

  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* ─── 1. HERO SECTION ─── */}
      <section style={{
        padding: 'clamp(20px, 3vw, 36px) clamp(20px, 4vw, 48px) clamp(36px, 4.5vw, 54px)',
        background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-main) 100%)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Two-column Hero Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
            gap: 'clamp(20px, 3.5vw, 48px)',
            alignItems: 'center',
            marginBottom: 'clamp(32px, 4vw, 44px)'
          }}>
            {/* Left Column: Text & CTAs */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-tint)', border: '1px solid var(--border-color)',
                fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)',
                marginBottom: '14px', letterSpacing: '0.02em'
              }}>
                <span style={{ fontSize: '12px' }}>✦</span> A calmer way to discover and shop
              </div>

              <h1 style={{
                fontSize: 'clamp(32px, 4.2vw, 48px)', fontWeight: 600,
                lineHeight: 1.16, letterSpacing: '-0.03em', color: 'var(--text-primary)',
                marginBottom: '14px'
              }}>
                Shopping that understands what you <span style={{ color: 'var(--brand-primary)' }}>actually need.</span>
              </h1>

              <p style={{
                fontSize: 'clamp(14px, 1.6vw, 17px)', color: 'var(--text-secondary)',
                lineHeight: 1.65, maxWidth: '560px', fontWeight: 400, marginBottom: '22px'
              }}>
                Discover relevant products, refine your preferences with AI, and build personalized shopping plans without getting overwhelmed by endless choices.
              </p>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                <Link
                  to="/app/ask"
                  className="btn btn-primary"
                  style={{ padding: '11px 26px', fontSize: '14px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  Meet Your AI Assistant <ArrowRight size={15} />
                </Link>
              </div>

              {/* Editorial micro-trust highlights */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span> 100% Encrypted Sessions
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--brand-primary)' }}>✓</span> Transparent Savings
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--brand-primary)' }}>✓</span> Curated Quality
                </div>
              </div>
            </div>

            {/* Right Column: Editorial Hero Visual Composition */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-xl)',
                background: 'var(--bg-card)'
              }}>
                <img
                  src="/hero-curation.jpg"
                  alt="Curated lifestyle and shopping collection"
                  style={{
                    width: '100%',
                    height: 'clamp(280px, 32vw, 380px)',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />

                {/* Subtle top floating tag */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(19, 25, 34, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  <span style={{ color: 'var(--brand-accent)' }}>✦</span> Curated Living & Audio
                </div>

                {/* Bottom floating plan pill */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  background: 'rgba(19, 25, 34, 0.88)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Sample Personalized Plan
                    </div>
                    <div style={{ fontSize: '14px', color: '#F8FAFC', fontWeight: 600, marginTop: '2px' }}>
                      Desk & Audio Bundle · ₹3,800
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(52, 211, 153, 0.18)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#34D399',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    whiteSpace: 'nowrap'
                  }}>
                    Save ₹1,200 (32%)
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Realistic Product / Platform Composition Preview */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)', overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Window bar */}
            <div style={{
              height: '44px', borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 20px'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--border-strong)' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--border-strong)' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--border-strong)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '12px', fontWeight: 500 }}>
                  meesho-sakhi.com/discover/curated
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                <Lock size={12} /> Encrypted Private Session
              </div>
            </div>

            {/* Platform Composition Body */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', minHeight: '380px' }}>
              {/* Left Column: Conversational AI snippet */}
              <div style={{
                padding: 'clamp(20px, 3vw, 36px)', borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                    Active Consultation
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* User speech */}
                    <div style={{
                      alignSelf: 'flex-end', background: 'var(--brand-primary)', color: '#FFFFFF',
                      padding: '12px 16px', borderRadius: '14px 14px 2px 14px', fontSize: '13px',
                      maxWidth: '88%', lineHeight: 1.5
                    }}>
                      "I need practical essentials for a clean desk setup under ₹4,000."
                    </div>

                    {/* AI speech */}
                    <div style={{
                      alignSelf: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '14px 14px 14px 2px',
                      fontSize: '13px', maxWidth: '92%', lineHeight: 1.5, boxShadow: 'var(--shadow-sm)'
                    }}>
                      Let's keep it minimal and practical. I've curated a compact LED desk lamp, ergonomic riser, and cable organizer within your ₹4,000 budget.
                    </div>
                  </div>
                </div>

                {/* Subtle Action Chips */}
                <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '8px' }}>
                    QUICK REFINEMENTS
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      Make it cheaper
                    </span>
                    <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      Something more minimal
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Realistic Plan Preview */}
              <div style={{ padding: 'clamp(24px, 3vw, 36px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Curated Plan
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        Minimal Desk Setup
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-primary)' }}>₹3,450</div>
                      <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>₹550 under budget</div>
                    </div>
                  </div>

                  {/* Curated Mini Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { name: "Minimal Aluminum Laptop Riser", category: "Electronics", price: "₹1,450", badge: "Verified 4.8★" },
                      { name: "Warm-Light LED Desk Companion", category: "Home & Living", price: "₹1,250", badge: "Top Value" },
                      { name: "Braided Cable Management Hub", category: "Accessories", price: "₹750", badge: "Practical" }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.category} • {item.badge}</div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>3 products • Ready to save</span>
                  <Link to="/app/ask" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
                    Personalize your own →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. STORYTELLING SECTION: The Problem ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(32px, 4vw, 64px)', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              The Challenge
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '24px' }}>
              Shopping should not feel like searching through everything.
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
              Online marketplaces today present millions of choices. Yet more products often lead to more confusion: endless pagination, irrelevant sponsored listings, ambiguous specifications, and decision fatigue.
            </p>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              We built Meesho Sakhi around the opposite premise: helping you reach confident decisions by understanding your real constraints—your budget, preferences, and lifestyle context.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-main)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '36px 32px', display: 'flex',
            flexDirection: 'column', gap: '24px'
          }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Traditional Marketplace
              </div>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Endless catalog pages, guesswork comparisons, and noisy recommendations.
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Meesho Sakhi Approach
              </div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '6px', lineHeight: 1.6 }}>
                Contextual intent understanding, verified product attributes, curated alternatives, and structured savings plans.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. WHAT WE ARE ("What we're building") ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              What We're Building
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              A smarter commerce experience driven by understanding.
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              We combine catalog discovery with adaptive intelligence so you can find what fits, without the noise.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px' }}>
            {[
              { title: "Natural Discovery", desc: "Search the way you speak, whether describing a specific style or a budget challenge." },
              { title: "Intelligent Guidance", desc: "Consult our AI assistant to narrow down options with practical, honest product comparisons." },
              { title: "Personalized Plans", desc: "Organize items into actionable plans that preserve your budget and match your priorities." },
              { title: "Genuine Savings", desc: "Discover realistic alternatives that lower cost without sacrificing design or durability." }
            ].map((f, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', padding: '28px 24px',
                boxShadow: '0 2px 8px rgba(36, 84, 144, 0.03)'
              }}>
                <div style={{ width: '28px', height: '2px', background: 'var(--brand-accent)', marginBottom: '18px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. WHY WE STARTED & OUR GOAL ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(32px, 4vw, 64px)', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
              Why We Started
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Traditional marketplaces give users more products. We want to give users better decisions.
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
              The goal is not to overwhelm people with thousands of identical listings. The goal is to help them find the products that actually fit their lives, their spaces, and their spending boundaries.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Our goal is simple: make online shopping feel personal again.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-tint)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
            padding: 'clamp(24px, 3vw, 36px) clamp(20px, 3vw, 32px)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Our Mission
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '14px', lineHeight: 1.4 }}>
              "Combine commerce, personalization, and intelligent assistance into one seamless, calm experience."
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              Without hype or intrusive ads, we focus purely on the utility of clear product recommendations and respectful, private interactions.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5. PRODUCT DISCOVERY: "Find something that fits." ─── */}
      <section id="discovery-section" style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Curated Selection
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Find something that fits.
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Explore products across categories or let your preferences guide the way.
              </p>
            </div>

            {/* Category Filter Navigation */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '4px' }} className="scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 18px', borderRadius: 'var(--radius-full)',
                    background: activeCategory === cat ? 'var(--brand-primary)' : 'var(--bg-card)',
                    color: activeCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: activeCategory === cat ? 'var(--brand-primary)' : 'var(--border-color)',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid (Minimum 6 products per category from real data) */}
          <div className="responsive-product-grid">
            {categoryProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                isWishlisted={wishlistedIds.has(prod.id)}
                onWishlistToggle={(p, state) => {
                  setWishlistedIds(prev => {
                    const next = new Set(prev);
                    if (state) next.add(p.id);
                    else next.delete(p.id);
                    return next;
                  });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. PRODUCT CAROUSELS ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Editorial Collection
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                Featured for You
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => scrollCarousel('left')}
                style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-secondary)'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-secondary)'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={carouselRef}
            style={{
              display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '12px',
              scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}
          >
            {featuredProducts.map((prod) => (
              <div
                key={prod.id}
                style={{
                  minWidth: 'clamp(210px, 68vw, 260px)', maxWidth: '260px', flexShrink: 0, scrollSnapAlign: 'start'
                }}
              >
                <ProductCard
                  product={prod}
                  isWishlisted={wishlistedIds.has(prod.id)}
                  onWishlistToggle={(p, state) => {
                    setWishlistedIds(prev => {
                      const next = new Set(prev);
                      if (state) next.add(p.id);
                      else next.delete(p.id);
                      return next;
                    });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. AI ASSISTANT: "Not sure what you're looking for?" ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(28px, 4vw, 56px)', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Conversational Assistance
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Not sure what you're looking for?
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              Describe what you're trying to achieve, your constraints, or a budget target. The assistant narrows down the catalog with genuine recommendations and provides interactive refinements.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                <CheckCircle2 size={16} color="var(--brand-primary)" /> Practical comparisons without endless filters
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                <CheckCircle2 size={16} color="var(--brand-primary)" /> Budget optimization and cheaper alternatives
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                <CheckCircle2 size={16} color="var(--brand-primary)" /> 100% private: chats are never viewable by administrators
              </div>
            </div>
            <div style={{ marginTop: '32px' }}>
              <Link to="/app/ask" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px' }}>
                Open AI Assistant
              </Link>
            </div>
          </div>

          {/* Interactive Chat Demonstration (No cartoon robots or neon) */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: '0 4px 18px rgba(36, 84, 144, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-accent)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Sakhi Consultation</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Live Demo</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ alignSelf: 'flex-end', background: 'var(--brand-primary)', color: '#FFFFFF', padding: '10px 14px', borderRadius: '12px 12px 2px 12px', fontSize: '13px', maxWidth: '85%' }}>
                "I need something for a small work desk under ₹5,000."
              </div>
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '12px 12px 12px 2px', fontSize: '13px', maxWidth: '90%', lineHeight: 1.5 }}>
                Let's keep it practical. Here are compact options that fit your budget:
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)' }}>• Slim Dual-Arm Desk Lamp (₹1,200)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)' }}>• Vertical Stand for 13–16" Laptops (₹950)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)' }}>• Felt Desk Blotter & Organizer (₹650)</div>
                </div>
              </div>

              {/* Action Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <Link to="/app/ask?q=Make%20it%20cheaper" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--brand-primary)' }}>
                    Make it cheaper
                  </span>
                </Link>
                <Link to="/app/ask?q=Show%20another%20option" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--brand-primary)' }}>
                    Show another option
                  </span>
                </Link>
                <Link to="/app/ask?q=Something%20more%20minimal" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--brand-primary)' }}>
                    Something more minimal
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. PERSONALIZATION & SAVINGS: "Your preferences. Your way of shopping." ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Adaptive Intelligence
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '14px' }}>
              Your preferences. Your way of shopping.
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              From initial intent to final checkout, every decision is guided by your boundaries, learning from what you save and reject.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
            {[
              { num: "01", step: "User Intent", desc: "Express what you need in plain words, including budget or lifestyle context." },
              { num: "02", step: "Preferences", desc: "Implicit styles and hard limits are refined without manual questionnaires." },
              { num: "03", step: "Understanding", desc: "Catalog attributes are evaluated for durability, price, and fit." },
              { num: "04", step: "Relevant Products", desc: "Only high-confidence recommendations surface in your results." },
              { num: "05", step: "Personalized Plan", desc: "Organized into a coherent cart with genuine savings calculated." }
            ].map((st, i) => (
              <div key={i} style={{
                background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', padding: '24px 20px', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '12px' }}>
                  {st.num}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {st.step}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. HOW IT WORKS (01–05 Editorial Workflow) ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ maxWidth: '640px', marginBottom: '56px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Clear Process
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '14px' }}>
              How Meesho Sakhi works
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              A straightforward progression designed to give you clarity rather than clutter.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '24px' }}>
            {[
              { step: "01", title: "Tell us what you need", text: "Speak or type your goals naturally without filter gymnastics." },
              { step: "02", title: "Refine preferences", text: "Indicate budget limits or style nuances in seconds." },
              { step: "03", title: "Explore products", text: "Examine curated options with transparent pricing and specs." },
              { step: "04", title: "Build your plan", text: "Group complementary items into organized shopping plans." },
              { step: "05", title: "Save and manage", text: "Revisit and tweak your plans anytime on your private dashboard." }
            ].map((item, i) => (
              <div key={i} style={{ borderLeft: '2px solid var(--border-strong)', paddingLeft: '20px' }}>
                <div style={{ fontSize: '20px', fontWeight: 300, color: 'var(--brand-primary)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                  {item.step}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. PRIVACY-FIRST COMMITMENT ─── */}
      <section style={{ padding: 'clamp(36px, 4.5vw, 60px) clamp(20px, 4vw, 48px)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tint)',
            border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: 'var(--brand-primary)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Your conversations are private by design.
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '680px', margin: '0 auto 28px' }}>
            Your preferences belong to you. Consultation messages are encrypted with AES-256-GCM. Administrative interfaces enforce strict privilege boundaries and can never read your dialogue in plaintext.
          </p>
          <Link to="/about" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-primary)', textDecoration: 'none' }}>
            Read about our security architecture →
          </Link>
        </div>
      </section>

      {/* ─── 11. FINAL EDITORIAL CTA ─── */}
      <section style={{ padding: 'clamp(44px, 5.5vw, 68px) clamp(20px, 4vw, 48px)', background: 'var(--bg-main)', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Ready for a calmer commerce experience?
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '36px' }}>
            Experience intelligent product discovery tailored around your real life.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/app/ask" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}>
              Start With Assistant
            </Link>
            <Link to="/search" className="btn btn-secondary" style={{ padding: '12px 32px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}>
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
