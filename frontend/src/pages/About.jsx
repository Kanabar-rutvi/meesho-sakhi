import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Compass, Sparkles, Target, ArrowRight, Lock, Heart } from 'lucide-react';

export default function About() {
  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* ─── Hero / Header ─── */}
      <section style={{
        padding: 'clamp(56px, 8vw, 96px) clamp(20px, 4vw, 48px)',
        background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-main) 100%)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-tint)', border: '1px solid var(--border-color)',
            fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)',
            marginBottom: '24px'
          }}>
            ✦ Our Philosophy
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600,
            lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '24px'
          }}>
            Commerce built around your actual life, not endless inventories.
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)',
            lineHeight: 1.7, maxWidth: '680px', margin: '0 auto'
          }}>
            We are redefining product discovery through calm, editorial design, adaptive intelligence, and zero-compromise user privacy.
          </p>
        </div>
      </section>

      {/* ─── 1. What We Are & Why We Started ─── */}
      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '64px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              What We Are
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              An intelligent shopping companion.
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Meesho Sakhi is an AI-powered commerce platform that helps you discover, evaluate, and plan purchases. Rather than indexing products into overwhelming grids, Sakhi curates selections around your real budget and style preferences.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Why We Started
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Solving the fatigue of infinite choice.
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Shopping should feel rewarding, not exhausting. When every marketplace search produces thousands of near-identical items with conflicting reviews and sponsored placements, people settle instead of making great choices. We built Sakhi to bring clarity back.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 2. The Problem & Our Approach ─── */}
      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Diagnosis & Method
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '14px' }}>
              The Problem & Our Approach
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              How we rethought the relationship between shopper, catalog, and intelligence.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', padding: '32px 28px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#D33636', marginBottom: '12px', textTransform: 'uppercase' }}>
                The Problem
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • <b>Choice paralysis:</b> Sifting through 50+ pages of products with indistinguishable features.
                </li>
                <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • <b>Disjointed carts:</b> Buying items one by one without knowing whether they work together.
                </li>
                <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • <b>Invasive tracking:</b> Intrusive ad-retargeting and exposed conversational history.
                </li>
              </ul>
            </div>

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', padding: '32px 28px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Our Approach
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • <b>Intent understanding:</b> Natural dialogue translates requests into verified catalog criteria.
                </li>
                <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • <b>Holistic planning:</b> Bundles and recommendations are organized into a single balanced budget plan.
                </li>
                <li style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • <b>Cryptographic privacy:</b> AES-256-GCM encryption with zero admin access to user messages.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. What We Believe ─── */}
      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ maxWidth: '600px', marginBottom: '48px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Core Values
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '14px' }}>
              What We Believe
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Foundational principles that guide every feature we design.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              {
                title: "Calm Over Chaos",
                text: "Commerce interfaces should be restful, editorial, and visually respectful, never noisy or frantic."
              },
              {
                title: "Decisions Over Volume",
                text: "Showing 6 perfect products that match budget and taste is infinitely better than listing 600 generic ones."
              },
              {
                title: "Privacy by Design",
                text: "Your conversations belong to you. We architect security so even our administrators cannot eavesdrop."
              },
              {
                title: "Real Value",
                text: "Savings calculations and price alternatives must be authentic and mathematically accurate."
              }
            ].map((v, i) => (
              <div key={i} style={{
                background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', padding: '24px'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {v.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. The Future ─── */}
      <section style={{ padding: 'clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)', background: 'var(--bg-main)', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            The Road Ahead
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            The Future of Personal Commerce
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px' }}>
            We're continuing to expand catalog depth, integrate multi-modal room planning, and push the boundary of private client-side preference learning.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/search" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px' }}>
              Explore Our Catalog
            </Link>
            <Link to="/app/ask" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px' }}>
              Start With Assistant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
