import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, CheckCircle, ShoppingBag, AlertCircle } from 'lucide-react';

// Mock history data — in production this comes from the backend
const MOCK_HISTORY = [
  {
    id: 'h1',
    goal: 'Hostel room setup in Mumbai',
    budget: 15000,
    spent: 13450,
    items: 8,
    date: 'Today',
    status: 'completed',
    categories: ['bedding', 'study', 'kitchen', 'electronics']
  },
  {
    id: 'h2',
    goal: 'Diwali outfit shopping for family',
    budget: 8000,
    spent: 7200,
    items: 5,
    date: '3 days ago',
    status: 'completed',
    categories: ['clothing', 'accessories']
  },
  {
    id: 'h3',
    goal: 'Kitchen essentials for PG room',
    budget: 5000,
    spent: 0,
    items: 0,
    date: '1 week ago',
    status: 'abandoned',
    categories: ['kitchen', 'storage']
  },
];

export default function History() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div className="animate-fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={28} color="var(--brand-primary)" /> Shopping History
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {MOCK_HISTORY.length} shopping plans
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {MOCK_HISTORY.map((plan, idx) => (
            <Link key={plan.id} to="/app/ask" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card animate-fade-in" style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                animationDelay: `${idx * 80}ms`, padding: '20px',
                cursor: 'pointer'
              }}>
                {/* Status icon */}
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: 'var(--radius-full)',
                  background: plan.status === 'completed' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {plan.status === 'completed'
                    ? <CheckCircle size={24} color="var(--success)" />
                    : <AlertCircle size={24} color="var(--text-tertiary)" />
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
                    {plan.goal}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShoppingBag size={14} /> {plan.items} items
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      ₹{plan.spent.toLocaleString()} / ₹{plan.budget.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {plan.date}
                    </span>
                  </div>

                  {/* Category pills */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {plan.categories.map(cat => (
                      <span key={cat} style={{
                        fontSize: '10px', fontWeight: 600,
                        color: 'var(--brand-primary)',
                        background: 'rgba(147,51,234,0.06)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'capitalize'
                      }}>{cat}</span>
                    ))}
                  </div>
                </div>

                {/* Budget utilization bar */}
                <div style={{ width: '80px', flexShrink: 0 }}>
                  {plan.status === 'completed' && (
                    <>
                      <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', textAlign: 'right' }}>
                        {Math.round((plan.spent / plan.budget) * 100)}%
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', marginTop: '4px' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.round((plan.spent / plan.budget) * 100)}%`,
                          background: 'var(--success)',
                          borderRadius: 'var(--radius-full)'
                        }} />
                      </div>
                    </>
                  )}
                  {plan.status === 'abandoned' && (
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'right', fontWeight: 500 }}>
                      Abandoned
                    </div>
                  )}
                </div>

                <ChevronRight size={20} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
