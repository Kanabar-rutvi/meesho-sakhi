import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, CheckCircle, ShoppingBag, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      const fetchHistory = async () => {
        try {
          const token = localStorage.getItem('token');
          const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
          const baseUrl = envUrl || "http://localhost:8000";
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
  }, [user, navigate]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading history...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div className="animate-fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={28} color="var(--brand-primary)" /> Shopping History
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {history.length} shopping plans
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((plan, idx) => (
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
